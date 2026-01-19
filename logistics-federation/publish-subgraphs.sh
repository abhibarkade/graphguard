#!/bin/bash

# Usage: ./publish-subgraphs.sh <YOUR_GRAPH_ID>
# Example: ./publish-subgraphs.sh logistics-graph@current

GRAPH_ID=$1

if [ -z "$GRAPH_ID" ]; then
  echo "Error: Please provide your Apollo Graph ID."
  echo "Usage: ./publish-subgraphs.sh <YOUR_GRAPH_ID>"
  exit 1
fi

echo "Publishing Inventory Subgraph..."
rover subgraph publish "$GRAPH_ID@current" \
  --name inventory \
  --schema services/inventory/schema.graphql \
  --routing-url http://localhost:4001 \
  --allow-invalid-routing-url

echo "Publishing Shipping Subgraph..."
rover subgraph publish "$GRAPH_ID@current" \
  --name shipping \
  --schema services/shipping/schema.graphql \
  --routing-url http://localhost:4002 \
  --allow-invalid-routing-url

echo "Publishing Tracking Subgraph..."
rover subgraph publish "$GRAPH_ID@current" \
  --name tracking \
  --schema services/tracking/schema.graphql \
  --routing-url http://localhost:4003 \
  --allow-invalid-routing-url

echo "All subgraphs published!"
