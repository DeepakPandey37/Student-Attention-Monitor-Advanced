import subprocess
import sys
import os
import time

ROOT     = os.path.dirname(os.path.abspath(__file__))
FRONTEND = os.path.join(ROOT, 'frontend')
BACKEND  = os.path.join(ROOT, 'backend')

YELLOW = '\033[93m'
GREEN  = '\033[92m'
CYAN   = '\033[96m'
RESET  = '\033[0m'
BOLD   = '\033[1m'

def banner():
    print(f"\n{BOLD}{CYAN}{'='*54}{RESET}")
    print(f"{BOLD}{CYAN}   🎓  Student Attention Monitor — Launcher{RESET}")
    print(f"{BOLD}{CYAN}{'='*54}{RESET}\n")

def start_frontend():
    print(f"{YELLOW}📦  Starting React frontend (Vite)...{RESET}")
    if sys.platform == 'win32':
        return subprocess.Popen(
            'npm run dev',
            cwd=FRONTEND,
            shell=True,
            creationflags=subprocess.CREATE_NEW_CONSOLE
        )
    else:
        return subprocess.Popen(
            ['npm', 'run', 'dev'],
            cwd=FRONTEND
        )

def start_backend():
    print(f"{YELLOW}🐍  Starting Flask backend...{RESET}")
    if sys.platform == 'win32':
        subprocess.run(f'"{sys.executable}" app.py', cwd=BACKEND, shell=True)
    else:
        subprocess.run([sys.executable, 'app.py'], cwd=BACKEND)

if __name__ == '__main__':
    banner()

    
    if not os.path.isdir(os.path.join(FRONTEND, 'node_modules')):
        print(f"{YELLOW}📥  node_modules not found — running npm install...{RESET}")
        subprocess.run('npm install', cwd=FRONTEND, shell=True)
        print(f"{GREEN}✅  npm install complete{RESET}\n")

    
    fe_proc = start_frontend()
    print(f"{GREEN}✅  React server starting on http://localhost:5173{RESET}\n")

    
    print(f"{YELLOW}⏳  Waiting 4s for Vite...{RESET}")
    time.sleep(4)

   
    print(f"{GREEN}✅  Launching Flask + opening browser...{RESET}\n")
    try:
        start_backend()
    except KeyboardInterrupt:
        pass
    finally:
        print(f"\n{YELLOW}🛑  Shutting down...{RESET}")
        fe_proc.terminate()
        print(f"{GREEN}✅  All processes stopped. Goodbye!{RESET}\n")
