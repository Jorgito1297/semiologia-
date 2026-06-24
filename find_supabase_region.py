import socket
import struct

REGIONS = [
    "us-east-1", "us-east-2", "us-west-1", "us-west-2",
    "ca-central-1", "sa-east-1", "eu-west-1", "eu-west-2",
    "eu-west-3", "eu-central-1", "eu-north-1",
    "ap-southeast-1", "ap-southeast-2",
    "ap-northeast-1", "ap-northeast-2", "ap-northeast-3",
    "ap-south-1", "me-central-1"
]

TENANT = "postgres.fnusnboleqnabqwqfucr"

def probe_region(region):
    host = f"aws-0-{region}.pooler.supabase.com"
    port = 5432
    print(f"Probing {region} ({host})...")
    try:
        # Resolve hostname
        ip = socket.gethostbyname(host)
    except socket.gaierror:
        # Host name doesn't exist
        return "Host not found"

    try:
        s = socket.create_connection((ip, port), timeout=3)
    except Exception as e:
        return f"Connection failed: {e}"

    try:
        # Build a basic Postgres StartupMessage
        # Packet format: length (4 bytes), protocol version (4 bytes), parameters (key/value null-terminated strings)
        user_param = b"user\x00" + TENANT.encode('utf-8') + b"\x00"
        db_param = b"database\x00postgres\x00"
        startup_msg = struct.pack("!I", 196608) + user_param + db_param + b"\x00"
        packet = struct.pack("!I", len(startup_msg) + 4) + startup_msg
        
        s.sendall(packet)
        response = s.recv(1024)
        s.close()
        
        # Check if the response contains an ErrorResponse ('E')
        if response and response[0] == 69:  # ASCII 'E'
            # Parse error fields (null-terminated fields starting with field type)
            err_text = response[5:].decode('utf-8', errors='ignore')
            if "not found" in err_text:
                return "Tenant not found"
            else:
                return f"Tenant found! Error: {err_text[:100]}"
        else:
            return f"Unexpected response: {response}"
    except Exception as e:
        return f"Error sending/receiving: {e}"

def main():
    for r in REGIONS:
        res = probe_region(r)
        print(f"Result for {r}: {res}")
        if "Tenant found" in res:
            print(f"\n🎉 FOUND TENANT IN REGION: {r}!")
            break

if __name__ == "__main__":
    main()
