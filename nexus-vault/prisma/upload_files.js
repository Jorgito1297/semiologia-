const fs = require('fs');
const path = require('path');
const { crypto } = require('crypto');
const { PrismaClient } = require('@prisma/client');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

// Configuration from env
const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT || 'http://nexus-vault-minio:9000',
  region: process.env.S3_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || 'minioadmin',
    secretAccessKey: process.env.S3_SECRET_KEY || 'minioadmin_secret_2026',
  },
  forcePathStyle: true,
});

const S3_BUCKET = process.env.S3_BUCKET || 'nexusvault-files';
const tenantId = '50afeb95-fb06-4663-8c8a-cfcb48639283'; // Demo University
const userId = '9369d12c-8cfc-4d15-ad2b-19df1e75be8c'; // DB ID
const firebaseUid = 'mock-uid-jn89259-uce-edu-do'; // Firebase UID
const email = 'jn89259@uce.edu.do';

const MIME_TYPES = {
  '.pdf': 'application/pdf',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.txt': 'text/plain',
  '.mp4': 'video/mp4',
  '.mp3': 'audio/mpeg',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
};

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

function getAllFiles(dirPath, arrayOfFiles = []) {
  if (!fs.existsSync(dirPath)) return arrayOfFiles;
  
  const files = fs.readdirSync(dirPath);
  
  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  });
  
  return arrayOfFiles;
}

async function uploadToS3(key, body, mimeType) {
  console.log(`[MINIO]: Subiendo objeto '${key}' (${mimeType})...`);
  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    Body: body,
    ContentType: mimeType,
  });
  await s3Client.send(command);
}

async function main() {
  console.log('🚀 Iniciando script de carga masiva de archivos a NEXUS VAULT...');
  
  const moodleDir = path.join(__dirname, 'material_moodle');
  const teamsDir = path.join(__dirname, 'teams_recordings');
  
  const moodleFiles = getAllFiles(moodleDir);
  const teamsFiles = getAllFiles(teamsDir);
  
  const allFiles = [...moodleFiles, ...teamsFiles];
  console.log(`Se encontraron ${allFiles.length} archivos para subir.`);
  
  let successCount = 0;
  let totalBytesUploaded = 0;
  
  for (const filePath of allFiles) {
    const fileName = path.basename(filePath);
    const size = fs.statSync(filePath).size;
    
    // Skip placeholder/empty small files or internal files
    if (size < 100 && (fileName === 'guia_semiologia.pdf' || fileName === 'lectura_complementaria.pdf' || fileName === 'presentacion_semiologia.pptx')) {
      console.log(`[OMITIDO]: Archivo placeholder: ${fileName}`);
      continue;
    }
    
    // Skip .keep files
    if (fileName === '.keep') {
      continue;
    }
    
    const mimeType = getMimeType(filePath);
    const fileId = uuidv4();
    const storagePath = `tenants/${tenantId}/users/${userId}/files/${fileId}-${fileName}`;
    
    console.log(`Procesando: ${fileName} (${(size / (1024 * 1024)).toFixed(2)} MB)`);
    
    try {
      // 1. Read file buffer
      const fileBuffer = fs.readFileSync(filePath);
      
      // 2. Upload to MinIO/S3
      await uploadToS3(storagePath, fileBuffer, mimeType);
      
      // 3. Register in Database
      const dbFile = await prisma.file.create({
        data: {
          id: fileId,
          tenantId,
          ownerId: userId,
          filename: fileName,
          objectKey: storagePath,
          mimeType,
          size: BigInt(size),
          scanStatus: 'CLEAN',
          isPublic: false,
          isEncrypted: false,
          metadata: {},
        }
      });
      
      // 4. Create Audit Log
      await prisma.auditLog.create({
        data: {
          tenantId,
          userId: firebaseUid,
          userEmail: email,
          action: 'FILE_UPLOAD',
          resource: `file:${fileId}`,
          method: 'INTERNAL',
          metadata: {
            fileName,
            size,
            mimeType,
          }
        }
      });
      
      successCount++;
      totalBytesUploaded += size;
      console.log(`✅ Subido exitosamente y registrado: ${fileName}`);
    } catch (err) {
      console.error(`❌ Fallo al subir '${fileName}':`, err);
    }
  }
  
  // 5. Update user storageUsed
  if (successCount > 0) {
    console.log(`Actualizando almacenamiento del usuario en la base de datos...`);
    const currentStorage = await prisma.file.aggregate({
      where: {
        ownerId: userId,
        deletedAt: null,
      },
      _sum: {
        size: true,
      }
    });
    
    const totalSize = currentStorage._sum.size || BigInt(0);
    
    await prisma.user.update({
      where: { id: userId },
      data: {
        storageUsed: totalSize,
      }
    });
    console.log(`Base de datos actualizada. Almacenamiento total usado por el usuario: ${(Number(totalSize) / (1024*1024)).toFixed(2)} MB`);
  }
  
  console.log(`\n🎉 SINOPSIS: Se subieron ${successCount} archivos a NEXUS VAULT (${(totalBytesUploaded / (1024*1024)).toFixed(2)} MB cargados).`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
