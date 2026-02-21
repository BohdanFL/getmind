pipeline {
    agent any

    environment {
        PYTHON_VERSION = '3.10'
        NODE_VERSION = '18'
        // Jenkins сам знайде IP Windows-хоста через шлюз за замовчуванням
        OLLAMA_BASE_URL = "http://${sh(script: "ip route show | grep default | awk '{print \$3}'", returnStdout: true).trim()}:11434"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Backend: Lint & Security') {
            steps {
                dir('backend') {
                    echo '📦 Installing quality tools...'
                    sh '''
                        python3 -m venv venv
                        . venv/bin/activate
                        pip install ruff bandit
                    '''
                    
                    echo '🔍 Running Ruff (Linting)...'
                    sh '. venv/bin/activate && ruff check .'
                    
                    echo '🛡️ Running Bandit (Security Scan)...'
                    sh '. venv/bin/activate && bandit -r app/'
                }
            }
        }

        stage('Backend: Test') {
            steps {
                dir('backend') {
                    echo '⚙️ Installing all dependencies...'
                    sh '''
                        . venv/bin/activate
                        pip install -r requirements.txt
                    '''
                    
                    echo '🧪 Running Sanity Tests...'
                    sh '. venv/bin/activate && python test_setup.py'
                    
                    echo '🧪 Running RAG Logic Tests...'
                    sh '. venv/bin/activate && python test_rag_logic.py'
                }
            }
        }

        stage('Frontend: Lint & Typecheck') {
            steps {
                dir('frontend') {
                    echo '📦 Installing dependencies...'
                    sh 'npm install'
                    
                    echo '🔍 Running ESLint...'
                    sh 'npm run lint'
                    
                    echo '🛡️ Running npm audit...'
                    sh 'npm audit --audit-level=high'

                    echo '⌨️ Type checking...'
                    sh 'npx tsc -b'
                }
            }
        }

        stage('Frontend: Build') {
            steps {
                dir('frontend') {
                    echo '🏗️ Building production assets...'
                    sh 'npm run build'
                }
            }
        }

        stage('Archive Artifacts') {
            steps {
                echo '📁 Storing build results...'
                archiveArtifacts artifacts: 'frontend/dist/**', allowEmptyArchive: true
            }
        }
    }

    post {
        success {
            echo '🚀 Pipeline completed successfully! GetMind is stable and built.'
        }
        failure {
            echo '❌ Pipeline failed! Review the logs to identify the issue.'
        }
    }
}
