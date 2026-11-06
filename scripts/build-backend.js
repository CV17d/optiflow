const { spawnSync } = require('child_process')
const path = require('path')
const fs = require('fs')

const isWin = process.platform === 'win32'
const rootDir = path.resolve(__dirname, '..')
const engineDir = path.join(rootDir, 'optiflow-engine')
const outputDir = path.join(rootDir, 'resources', 'backend')
const binaryName = isWin ? 'optiflow-engine.exe' : 'optiflow-engine'
const specPath = path.join(engineDir, 'optiflow-engine.spec')

console.log(`[Build Backend] Compilando backend Python para plataforma: ${process.platform}...`)

// Asegurar que la carpeta resources/backend exista
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

// Determinar el ejecutable de Python
let pythonExecutable = process.env.PYTHON || (isWin
  ? path.join(engineDir, '.venv', 'Scripts', 'python.exe')
  : path.join(engineDir, '.venv', 'bin', 'python'))

if (!process.env.PYTHON && !fs.existsSync(pythonExecutable)) {
  pythonExecutable = isWin ? 'python' : 'python3'
}

console.log(`[Build Backend] Usando entorno Python: ${pythonExecutable}`)

const args = [
  '-m',
  'PyInstaller',
  '--clean',
  '--distpath',
  outputDir,
  '--workpath',
  path.join(engineDir, 'build'),
  specPath
]

const result = spawnSync(pythonExecutable, args, {
  cwd: engineDir,
  stdio: 'inherit',
  shell: true
})

if (result.status !== 0) {
  console.error('[Build Backend] Error durante la compilación con PyInstaller.')
  process.exit(result.status || 1)
}

const targetBinary = path.join(outputDir, binaryName)
if (fs.existsSync(targetBinary)) {
  if (!isWin) {
    try {
      fs.chmodSync(targetBinary, 0o755)
      console.log(`[Build Backend] Permisos 0755 (chmod +x) aplicados a: ${targetBinary}`)
    } catch (e) {
      console.warn(`[Build Backend] No se pudieron aplicar permisos a ${targetBinary}:`, e)
    }
  }
  console.log(`[Build Backend] Binario compilado exitosamente en: ${targetBinary}`)
} else {
  console.warn(`[Build Backend] Advertencia: No se encontró el binario en: ${targetBinary}`)
}
