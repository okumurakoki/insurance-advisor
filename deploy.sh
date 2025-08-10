#!/bin/bash

# Insurance Advisor Deployment Script
# Usage: ./deploy.sh [environment]
# Environment: development, staging, production (default: production)

set -e

ENVIRONMENT=${1:-production}
PROJECT_NAME="insurance-advisor"

echo "🚀 Starting deployment for $ENVIRONMENT environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed and running
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi

    if ! docker info &> /dev/null; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
}

# Check if environment file exists
check_env_file() {
    ENV_FILE=".env"
    
    if [ "$ENVIRONMENT" = "production" ]; then
        ENV_FILE=".env.production"
    elif [ "$ENVIRONMENT" = "staging" ]; then
        ENV_FILE=".env.staging"
    fi

    if [ ! -f "$ENV_FILE" ]; then
        print_error "Environment file $ENV_FILE not found."
        print_warning "Please copy .env.example to $ENV_FILE and configure it."
        exit 1
    fi

    print_status "Using environment file: $ENV_FILE"
    
    # Use the environment file
    export $(grep -v '^#' $ENV_FILE | xargs)
}

# Build and deploy
deploy() {
    print_status "Building and deploying containers..."

    # Stop existing containers
    print_status "Stopping existing containers..."
    docker-compose -p $PROJECT_NAME down || true

    # Remove old images (optional, uncomment if needed)
    # print_status "Removing old images..."
    # docker system prune -f

    # Build and start containers
    print_status "Building new images..."
    docker-compose -p $PROJECT_NAME build --no-cache

    print_status "Starting containers..."
    docker-compose -p $PROJECT_NAME up -d

    # Wait for services to be ready
    print_status "Waiting for services to be ready..."
    sleep 30

    # Check if services are healthy
    check_health
}

# Check service health
check_health() {
    print_status "Checking service health..."

    # Check database
    if docker-compose -p $PROJECT_NAME exec -T db mysqladmin ping -h localhost -u root -p$DB_ROOT_PASSWORD &> /dev/null; then
        print_status "✓ Database is healthy"
    else
        print_error "✗ Database is not responding"
        show_logs
        exit 1
    fi

    # Check API
    sleep 10
    if curl -f http://localhost:3000/health &> /dev/null; then
        print_status "✓ API is healthy"
    else
        print_error "✗ API is not responding"
        show_logs
        exit 1
    fi

    # Check frontend
    if curl -f http://localhost/health &> /dev/null; then
        print_status "✓ Frontend is healthy"
    else
        print_warning "✗ Frontend might not be responding (this is normal if using HTTPS)"
    fi
}

# Show logs for debugging
show_logs() {
    print_status "Showing recent logs..."
    docker-compose -p $PROJECT_NAME logs --tail=50
}

# Setup SSL certificates (placeholder)
setup_ssl() {
    print_status "Setting up SSL certificates..."
    
    # Create SSL directory
    mkdir -p nginx/ssl
    
    # For production, you would use Let's Encrypt or your own certificates
    # This is just a placeholder for development
    if [ ! -f "nginx/ssl/cert.pem" ]; then
        print_warning "SSL certificates not found. Creating self-signed certificates for development..."
        
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout nginx/ssl/key.pem \
            -out nginx/ssl/cert.pem \
            -subj "/C=JP/ST=Tokyo/L=Tokyo/O=Insurance Advisory/OU=IT Department/CN=localhost"
        
        print_warning "⚠️  Using self-signed certificates. For production, use proper SSL certificates."
    fi
}

# Database setup
setup_database() {
    print_status "Setting up database..."
    
    # Wait for MySQL to be ready
    print_status "Waiting for MySQL to be ready..."
    sleep 20
    
    # Run database migrations/setup if needed
    print_status "Database setup completed"
}

# Main deployment flow
main() {
    print_status "Insurance Advisor Deployment - Environment: $ENVIRONMENT"
    
    check_docker
    check_env_file
    setup_ssl
    deploy
    setup_database
    
    print_status "🎉 Deployment completed successfully!"
    print_status "Services:"
    print_status "  - Frontend: http://localhost (or https://localhost)"
    print_status "  - API: http://localhost:3000"
    print_status "  - Database: localhost:3306"
    
    print_status "To view logs: docker-compose -p $PROJECT_NAME logs -f"
    print_status "To stop services: docker-compose -p $PROJECT_NAME down"
}

# Handle script interruption
trap 'print_error "Deployment interrupted"; exit 1' INT TERM

# Run main function
main