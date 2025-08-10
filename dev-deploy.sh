#!/bin/bash

# Insurance Advisor Development Deployment Script
set -e

PROJECT_NAME="insurance-advisor-dev"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
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

# Deploy development environment
deploy_dev() {
    print_status "🚀 Starting development deployment..."

    # Stop existing containers
    print_status "Stopping existing containers..."
    docker-compose -f docker-compose.dev.yml -p $PROJECT_NAME down || true

    # Build and start containers
    print_status "Building development images..."
    docker-compose -f docker-compose.dev.yml -p $PROJECT_NAME build

    print_status "Starting development containers..."
    docker-compose -f docker-compose.dev.yml -p $PROJECT_NAME up -d

    # Wait for services to be ready
    print_status "Waiting for services to be ready..."
    sleep 20

    # Check if database is ready
    print_status "Checking database connection..."
    for i in {1..30}; do
        if docker-compose -f docker-compose.dev.yml -p $PROJECT_NAME exec -T db mysql -u root -proot_password_123 -e "SELECT 1" &> /dev/null; then
            print_status "✓ Database is ready"
            break
        fi
        if [ $i -eq 30 ]; then
            print_error "✗ Database failed to start"
            show_logs
            exit 1
        fi
        sleep 2
    done

    # Wait for API to be ready
    print_status "Checking API health..."
    for i in {1..30}; do
        if curl -f http://localhost:3000/health &> /dev/null; then
            print_status "✓ API is ready"
            break
        fi
        if [ $i -eq 30 ]; then
            print_warning "✗ API might not be responding yet"
            break
        fi
        sleep 2
    done

    # Check frontend
    print_status "Checking frontend..."
    sleep 5
    if curl -f http://localhost:3001 &> /dev/null; then
        print_status "✓ Frontend is ready"
    else
        print_warning "✗ Frontend might still be starting up"
    fi
}

# Show logs for debugging
show_logs() {
    print_status "Showing recent logs..."
    docker-compose -f docker-compose.dev.yml -p $PROJECT_NAME logs --tail=50
}

# Main function
main() {
    print_status "🏗️  Insurance Advisor Development Setup"
    
    check_docker
    deploy_dev
    
    print_status "🎉 Development environment is ready!"
    echo ""
    print_status "📱 Access URLs:"
    print_status "  Frontend: http://localhost:3001"
    print_status "  Backend API: http://localhost:3000"
    print_status "  API Health: http://localhost:3000/health"
    print_status "  Database: localhost:3306"
    echo ""
    print_status "📊 Management commands:"
    print_status "  View logs: docker-compose -f docker-compose.dev.yml -p $PROJECT_NAME logs -f"
    print_status "  Stop services: docker-compose -f docker-compose.dev.yml -p $PROJECT_NAME down"
    print_status "  Restart API: docker-compose -f docker-compose.dev.yml -p $PROJECT_NAME restart api"
    print_status "  Show this info: ./dev-deploy.sh --info"
    echo ""
    print_warning "⚠️  The system is running in DEVELOPMENT mode"
    print_warning "   Use mock NotebookLM API key for testing"
}

# Handle script arguments
if [ "$1" = "--info" ]; then
    print_status "📱 Access URLs:"
    print_status "  Frontend: http://localhost:3001"
    print_status "  Backend API: http://localhost:3000"
    print_status "  API Health: http://localhost:3000/health"
    exit 0
elif [ "$1" = "--logs" ]; then
    docker-compose -f docker-compose.dev.yml -p $PROJECT_NAME logs -f
    exit 0
elif [ "$1" = "--down" ]; then
    print_status "Stopping development environment..."
    docker-compose -f docker-compose.dev.yml -p $PROJECT_NAME down
    print_status "Development environment stopped"
    exit 0
fi

# Handle script interruption
trap 'print_error "Deployment interrupted"; exit 1' INT TERM

# Run main function
main