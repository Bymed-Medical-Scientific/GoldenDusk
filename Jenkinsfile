pipeline {
  agent any

  options {
    disableConcurrentBuilds()
    timestamps()
  }

  parameters {
    booleanParam(
      name: 'DEPLOY',
      defaultValue: true,
      description: 'Deploy after CI passes (main branch only).'
    )
    string(
      name: 'ENV_FILE',
      defaultValue: '/opt/goldendusk/GoldenDusk/.env',
      description: 'Absolute path to runtime .env file on Jenkins agent.'
    )
  }

  environment {
    DOTNET_CLI_TELEMETRY_OPTOUT = '1'
    DOTNET_NOLOGO = '1'
    NODE_ENV = 'production'
    CI = 'true'
  }

  stages {
    stage('Validate Build Tools') {
      steps {
        sh '''
          set -euo pipefail
          command -v dotnet >/dev/null 2>&1 || { echo "dotnet SDK is required on the Jenkins agent."; exit 1; }
          command -v node >/dev/null 2>&1 || { echo "node is required on the Jenkins agent."; exit 1; }
          command -v npm >/dev/null 2>&1 || { echo "npm is required on the Jenkins agent."; exit 1; }
          dotnet --info >/dev/null
          node --version >/dev/null
          npm --version >/dev/null
        '''
      }
    }

    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Restore Backend') {
      steps {
        sh 'dotnet restore Bymed.API/Bymed.API.csproj'
        sh 'dotnet restore Bymed.Tests/Bymed.Tests.csproj'
      }
    }

    stage('Build and Test Backend') {
      steps {
        sh 'dotnet build Bymed.API/Bymed.API.csproj -c Release --no-restore'
        sh 'dotnet test Bymed.Tests/Bymed.Tests.csproj -c Release --no-restore --verbosity minimal'
      }
    }

    stage('Build and Test Web') {
      steps {
        dir('bymed-web') {
          sh 'npm ci --include=dev'
          sh 'npm run lint'
          sh 'NODE_ENV=test npm test -- --ci --watch=false'
          sh 'npm run build'
        }
      }
    }

    stage('Build Admin') {
      steps {
        dir('bymed-admin') {
          sh 'npm ci --include=dev'
          sh 'npm run build'
        }
      }
    }

    stage('Deploy') {
      when {
        allOf {
          branch 'main'
          expression { return params.DEPLOY }
        }
      }
      steps {
        sh '''
          set -euo pipefail
          export ENV_FILE="${ENV_FILE}"
          test -f "${ENV_FILE}"
          bash scripts/restart-after-pull.sh
        '''
      }
    }
  }

  post {
    always {
      cleanWs(deleteDirs: true, notFailBuild: true)
    }
    success {
      echo 'Pipeline completed successfully.'
    }
    failure {
      echo 'Pipeline failed. Review stage logs for details.'
    }
  }
}
