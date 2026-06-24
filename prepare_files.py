import os
import shutil

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    
    src_moodle = os.path.join(base_dir, "material_moodle")
    src_teams = os.path.join(base_dir, "teams_recordings")
    
    dest_moodle = os.path.join(base_dir, "nexus-vault", "prisma", "material_moodle")
    dest_teams = os.path.join(base_dir, "nexus-vault", "prisma", "teams_recordings")
    
    # Copy Moodle files
    if os.path.exists(src_moodle):
        print(f"Copiando material de Moodle desde {src_moodle} a {dest_moodle}...")
        if os.path.exists(dest_moodle):
            shutil.rmtree(dest_moodle)
        shutil.copytree(src_moodle, dest_moodle)
        print("Copia de Moodle completada.")
        
    # Copy Teams files
    if os.path.exists(src_teams):
        print(f"Copiando grabaciones de Teams desde {src_teams} a {dest_teams}...")
        if os.path.exists(dest_teams):
            shutil.rmtree(dest_teams)
        shutil.copytree(src_teams, dest_teams)
        print("Copia de Teams completada.")

if __name__ == "__main__":
    main()
