// src/lib/services/systemHealthService.ts
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import fetch from 'node-fetch';
import { deploymentConfig } from '../config/deployment';

export interface SystemStatus {
  database: {
    connected: boolean;
    type: string;
    error?: string;
  };
  ollama: {
    connected: boolean;
    models?: string[];
    error?: string;
  };
  chromadb: {
    connected: boolean;
    error?: string;
  };
  system: {
    cpuUsage: number; // percentage
    memoryUsage: number; // percentage
    diskSpace: {
      total: number; // bytes
      free: number; // bytes
      used: number; // percentage
    };
  };
}

export class SystemHealthService {
  async checkSystemHealth(): Promise<SystemStatus> {
    const status: SystemStatus = {
      database: await this.checkDatabaseStatus(),
      ollama: await this.checkOllamaStatus(),
      chromadb: await this.checkChromaDBStatus(),
      system: await this.getSystemResourceUsage(),
    };
    
    return status;
  }
  
  private async checkDatabaseStatus(): Promise<SystemStatus['database']> {
    try {
      const { prisma } = await import('../db/prisma');
      
      // Execute a simple query to check connection
      await prisma.$queryRaw`SELECT 1`;
      
      return {
        connected: true,
        type: deploymentConfig.database.type,
      };
    } catch (error) {
      console.error('Database connection error:', error);
      return {
        connected: false,
        type: deploymentConfig.database.type,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
  
  private async checkOllamaStatus(): Promise<SystemStatus['ollama']> {
    try {
      const response = await fetch(`${deploymentConfig.ollama.url}/api/tags`);
      
      if (!response.ok) {
        throw new Error(`Ollama server returned ${response.status}`);
      }
      
      const data = await response.json() as any;
      const models = data.models ? data.models.map((model: any) => model.name) : [];
      
      return {
        connected: true,
        models,
      };
    } catch (error) {
      console.error('Ollama connection error:', error);
      return {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
  
  private async checkChromaDBStatus(): Promise<SystemStatus['chromadb']> {
    try {
      // Run a Python script to check ChromaDB
      const scriptPath = path.join(process.cwd(), 'scripts', 'chromadb', 'check_status.py');
      
      if (!fs.existsSync(scriptPath)) {
        // Create the script if it doesn't exist
        this.createChromaDBCheckScript(scriptPath);
      }
      
      const chromaDir = deploymentConfig.chromadb.directory;
      const pythonPath = deploymentConfig.chromadb.pythonPath;
      
      const result = await this.runPythonScript(pythonPath, [scriptPath, chromaDir]);
      const status = JSON.parse(result);
      
      return {
        connected: status.connected,
        error: status.error,
      };
    } catch (error) {
      console.error('ChromaDB check error:', error);
      return {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
  
  private async getSystemResourceUsage(): Promise<SystemStatus['system']> {
    try {
      const cpuUsage = await this.getCpuUsage();
      const memoryUsage = this.getMemoryUsage();
      const diskSpace = this.getDiskSpace(process.cwd());
      
      return {
        cpuUsage,
        memoryUsage,
        diskSpace,
      };
    } catch (error) {
      console.error('Error getting system resource usage:', error);
      return {
        cpuUsage: 0,
        memoryUsage: 0,
        diskSpace: {
          total: 0,
          free: 0,
          used: 0,
        },
      };
    }
  }
  
  private async getCpuUsage(): Promise<number> {
    // A simple method to estimate CPU usage on different platforms
    return new Promise((resolve) => {
      let scriptPath = '';
      
      if (process.platform === 'win32') {
        scriptPath = path.join(process.cwd(), 'scripts', 'system', 'cpu_usage_windows.ps1');
        this.createWindowsCpuScript(scriptPath);
        
        const process = spawn('powershell', ['-ExecutionPolicy', 'Bypass', '-File', scriptPath]);
        let output = '';
        
        process.stdout.on('data', (data) => {
          output += data.toString();
        });
        
        process.on('close', () => {
          const usage = parseFloat(output.trim());
          resolve(isNaN(usage) ? 0 : usage);
        });
      } else {
        // Linux/macOS
        const process = spawn('sh', ['-c', 'top -bn1 | grep "%Cpu(s)" | sed "s/.*, *\\([0-9.]*\\)%* id.*/\\1/" | awk \'{print 100 - $1}\'']);
        let output = '';
        
        process.stdout.on('data', (data) => {
          output += data.toString();
        });
        
        process.on('close', () => {
          const usage = parseFloat(output.trim());
          resolve(isNaN(usage) ? 0 : usage);
        });
      }
    });
  }
  
  private getMemoryUsage(): number {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    return Math.round(((totalMem - freeMem) / totalMem) * 100);
  }
  
  private getDiskSpace(directory: string): SystemStatus['system']['diskSpace'] {
    try {
      if (process.platform === 'win32') {
        // Windows implementation is more complex, simplified version here
        return {
          total: 100e9, // 100 GB placeholder
          free: 50e9,   // 50 GB placeholder
          used: 50,     // 50% placeholder
        };
      } else {
        // Linux/macOS
        const { stdout } = require('child_process').execSync(`df -k "${directory}"`);
        const lines = stdout.toString().trim().split('\n');
        const data = lines[1].split(/\s+/);
        
        const total = parseInt(data[1]) * 1024;
        const used = parseInt(data[2]) * 1024;
        const free = parseInt(data[3]) * 1024;
        const usedPercentage = Math.round((used / total) * 100);
        
        return {
          total,
          free,
          used: usedPercentage,
        };
      }
    } catch (error) {
      console.error('Error getting disk space:', error);
      return {
        total: 0,
        free: 0,
        used: 0,
      };
    }
  }
  
  private runPythonScript(pythonPath: string, args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const process = spawn(pythonPath, args);
      
      let output = '';
      let errorOutput = '';
      
      process.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      process.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      process.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Python script error: ${errorOutput}`));
        } else {
          resolve(output.trim());
        }
      });
    });
  }
  
  private createChromaDBCheckScript(scriptPath: string) {
    const scriptDir = path.dirname(scriptPath);
    
    if (!fs.existsSync(scriptDir)) {
      fs.mkdirSync(scriptDir, { recursive: true });
    }
    
    const scriptContent = `
import sys
import json
import os

def check_chromadb(chroma_dir):
    try:
        import chromadb
        
        # Check if ChromaDB directory exists
        if not os.path.exists(chroma_dir):
            return {
                "connected": False,
                "error": f"ChromaDB directory {chroma_dir} does not exist"
            }
        
        # Try to initialize a client
        client = chromadb.PersistentClient(path=chroma_dir)
        
        # Try to list collections to verify connection
        collections = client.list_collections()
        
        return {
            "connected": True
        }
    except ImportError:
        return {
            "connected": False,
            "error": "ChromaDB Python package is not installed"
        }
    except Exception as e:
        return {
            "connected": False,
            "error": str(e)
        }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({
            "connected": False,
            "error": "ChromaDB directory path not provided"
        }))
        sys.exit(1)
    
    chroma_dir = sys.argv[1]
    status = check_chromadb(chroma_dir)
    print(json.dumps(status))
`;
    
    fs.writeFileSync(scriptPath, scriptContent);
  }
  
  private createWindowsCpuScript(scriptPath: string) {
    const scriptDir = path.dirname(scriptPath);
    
    if (!fs.existsSync(scriptDir)) {
      fs.mkdirSync(scriptDir, { recursive: true });
    }
    
    const scriptContent = `
$CpuUsage = (Get-Counter '\\Processor(_Total)\\% Processor Time').CounterSamples.CookedValue
Write-Output $CpuUsage
`;
    
    fs.writeFileSync(scriptPath, scriptContent);
  }
}

export const systemHealthService = new SystemHealthService();
