#!/bin/bash

# Copybara sync scripts for gleaned-covid repository
# Make sure you have Copybara installed: https://github.com/google/copybara

# Sync from public gleaned TO private gleaned-covid
sync_from_public() {
    echo "Syncing from public gleaned repo to private gleaned-covid..."
    copybara copy.bara.sky public_to_private --force
}

# Sync from private gleaned-covid TO public gleaned
sync_to_public() {
    echo "Syncing from private gleaned-covid to public gleaned repo..."
    copybara copy.bara.sky private_to_public --force
}

# Show help
show_help() {
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  from-public    Sync changes from public gleaned repo"
    echo "  to-public      Sync changes to public gleaned repo"
    echo "  help           Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 from-public   # Pull latest changes from public repo"
    echo "  $0 to-public     # Push your changes to public repo"
}

# Main script logic
case "$1" in
    "from-public")
        sync_from_public
        ;;
    "to-public")
        sync_to_public
        ;;
    "help"|"--help"|"-h")
        show_help
        ;;
    *)
        echo "Error: Unknown command '$1'"
        echo ""
        show_help
        exit 1
        ;;
esac