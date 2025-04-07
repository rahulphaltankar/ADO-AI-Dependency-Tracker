import React, { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { graphApi } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Download, 
  Maximize2, 
  RefreshCw, 
  ZoomIn, 
  ZoomOut, 
  Filter, 
  RotateCcw 
} from 'lucide-react';
import * as d3 from 'd3';
import { DependencyNode, DependencyLink } from '@/lib/types';

const DependencyGraph = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<DependencyNode | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [highlightMode, setHighlightMode] = useState<'all' | 'high-risk' | 'critical-path'>('all');
  
  const { data: graphData, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/dependency-graph'],
    queryFn: graphApi.getDependencyGraph
  });

  const handleRefresh = () => {
    refetch();
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.2, 2.5));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.2, 0.5));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
  };

  const handleExportGraph = () => {
    // Create a temporary canvas to export the SVG as an image
    if (!svgRef.current) return;
    
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const svgBlob = new Blob([svgData], {type: 'image/svg+xml;charset=utf-8'});
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(svgBlob);
    downloadLink.download = 'dependency-graph.svg';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  useEffect(() => {
    if (!graphData || !svgRef.current) return;

    // Clear any existing content
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth || 800;
    const height = svgRef.current.clientHeight || 400;

    // Apply overall zoom level
    const zoomG = svg.append("g")
      .attr("transform", `scale(${zoomLevel})`);

    // Filter nodes and links based on highlight mode
    let filteredNodes = [...graphData.nodes];
    let filteredLinks = [...graphData.links];

    if (highlightMode === 'high-risk') {
      // Filter to only show high-risk items
      const highRiskNodeIds = new Set<number>();
      
      // First add nodes that are either source or target of a high-risk link
      graphData.links.forEach(link => {
        if (link.riskScore >= 70) {
          highRiskNodeIds.add(link.source as number);
          highRiskNodeIds.add(link.target as number);
        }
      });
      
      // Then add nodes that have high risk themselves
      graphData.nodes.forEach(node => {
        if (node.riskScore >= 70) {
          highRiskNodeIds.add(node.id);
        }
      });
      
      filteredNodes = graphData.nodes.filter(node => highRiskNodeIds.has(node.id));
      filteredLinks = graphData.links.filter(link => 
        link.riskScore >= 70 || 
        (highRiskNodeIds.has(link.source as number) && highRiskNodeIds.has(link.target as number))
      );
    } else if (highlightMode === 'critical-path') {
      // For critical path: would need backend support to identify critical path
      // For now, let's highlight the longest path from node 1
      const criticalNodeIds = new Set<number>([1]);
      const visited = new Set<number>();
      
      // Simple DFS to find a path
      const dfs = (nodeId: number, depth: number = 0) => {
        if (visited.has(nodeId)) return;
        visited.add(nodeId);
        
        const outgoingLinks = graphData.links.filter(link => link.source === nodeId);
        if (outgoingLinks.length > 0) {
          // Find the link with highest delay risk
          const riskiestLink = outgoingLinks.reduce((prev, curr) => {
            return (curr.riskScore > prev.riskScore) ? curr : prev;
          });
          
          criticalNodeIds.add(riskiestLink.target as number);
          dfs(riskiestLink.target as number, depth + 1);
        }
      };
      
      dfs(1);
      
      // Filter to only show critical path
      filteredNodes = graphData.nodes.filter(node => criticalNodeIds.has(node.id));
      filteredLinks = graphData.links.filter(link => 
        criticalNodeIds.has(link.source as number) && criticalNodeIds.has(link.target as number)
      );
    }

    // Create a force simulation
    const simulation = d3.forceSimulation(filteredNodes)
      .force("link", d3.forceLink(filteredLinks)
        .id((d: any) => d.id)
        .distance(120))
      .force("charge", d3.forceManyBody().strength(-400))
      .force("center", d3.forceCenter(width / (2 * zoomLevel), height / (2 * zoomLevel)))
      .force("collide", d3.forceCollide().radius(40))
      .force("x", d3.forceX(width / (2 * zoomLevel)).strength(0.05))
      .force("y", d3.forceY(height / (2 * zoomLevel)).strength(0.05));

    // Add zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.3, 3])
      .on("zoom", (event) => {
        zoomG.attr("transform", event.transform);
      });
    
    svg.call(zoom as any);

    // Add arrow markers for links
    zoomG.append("defs").selectAll("marker")
      .data(["normal", "warning", "high"])
      .enter().append("marker")
      .attr("id", d => `arrow-${d}`)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 25)  // Position the arrow away from the node
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("fill", d => d === "normal" ? "#0078D4" : d === "warning" ? "#FFAA44" : "#D13438")
      .attr("d", "M0,-5L10,0L0,5");

    // Create container for links
    const linkGroup = zoomG.append("g").attr("class", "links");

    // Create the links with curved paths and animated dashes for flow indication
    const link = linkGroup.selectAll("path")
      .data(filteredLinks)
      .enter()
      .append("path")
      .attr("stroke", (d: any) => d.color)
      .attr("stroke-width", (d: any) => d.width || 1.5)
      .attr("fill", "none")
      .attr("marker-end", (d: any) => 
        d.riskScore >= 70 ? "url(#arrow-high)" : 
        d.riskScore >= 40 ? "url(#arrow-warning)" : 
        "url(#arrow-normal)"
      )
      .style("stroke-dasharray", "5, 5")  // Add dashed style
      .style("animation", (d: any) => `dash ${6 - (d.riskScore / 20)}s linear infinite`); // Faster animation for higher risk

    // Add curved path for links
    function linkArc(d: any) {
      const dx = d.target.x - d.source.x;
      const dy = d.target.y - d.source.y;
      const dr = Math.sqrt(dx * dx + dy * dy) * 1.2;
      return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
    }

    // Create container for nodes
    const nodeGroup = zoomG.append("g").attr("class", "nodes");

    // Create the nodes
    const node = nodeGroup.selectAll("g")
      .data(filteredNodes)
      .enter()
      .append("g")
      .attr("class", "node")
      .on("click", (event, d: any) => {
        event.stopPropagation();
        setSelectedNode(selectedNode?.id === d.id ? null : d);
      })
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended)
      );

    // Add node shadows for 3D effect
    node.append("circle")
      .attr("r", (d: any) => getNodeRadius(d) + 2)
      .attr("fill", "rgba(0,0,0,0.3)")
      .attr("transform", "translate(3,3)");

    // Add node circles
    node.append("circle")
      .attr("r", getNodeRadius)
      .attr("fill", (d: any) => d.color)
      .attr("stroke", "#fff")
      .attr("stroke-width", 2);

    // Add type icon in the center
    node.append("text")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .attr("fill", "white")
      .attr("font-size", "10px")
      .attr("font-weight", "bold")
      .attr("dy", -5)
      .text((d: any) => getNodeIcon(d.type));

    // Add node labels
    node.append("text")
      .text((d: any) => d.label)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .attr("fill", "white")
      .attr("font-size", (d: any) => d.id === 1 ? "14px" : "12px")
      .attr("dy", 7)
      .attr("font-weight", (d: any) => d.id === 1 ? "bold" : "normal");

    // Add detailed tooltips
    node.append("title")
      .text((d: any) => {
        return `ID: ${d.adoId}
Title: ${d.title}
Type: ${d.type}
State: ${d.state}
Team: ${d.team}
Sprint: ${d.sprint}
Risk Score: ${d.riskScore}%`;
      });

    // Create a semi-transparent overlay for detailed node info when selected
    function updateSelectedNodeInfo() {
      // Remove any existing info panel
      svg.selectAll(".node-info-panel").remove();
      
      if (selectedNode) {
        const infoPanel = svg.append("g")
          .attr("class", "node-info-panel")
          .attr("pointer-events", "none");
          
        // Background panel
        infoPanel.append("rect")
          .attr("x", 10)
          .attr("y", 10)
          .attr("width", 220)
          .attr("height", 140)
          .attr("fill", "rgba(255, 255, 255, 0.9)")
          .attr("stroke", selectedNode.color)
          .attr("stroke-width", 2)
          .attr("rx", 8);
          
        // Header
        infoPanel.append("rect")
          .attr("x", 10)
          .attr("y", 10)
          .attr("width", 220)
          .attr("height", 30)
          .attr("fill", selectedNode.color)
          .attr("rx", 8)
          .attr("ry", 0);
          
        // Title
        infoPanel.append("text")
          .attr("x", 20)
          .attr("y", 30)
          .text(`#${selectedNode.adoId}: ${selectedNode.title.substring(0, 25)}${selectedNode.title.length > 25 ? '...' : ''}`)
          .attr("fill", "white")
          .attr("font-weight", "bold");
          
        // Info content
        const details = [
          { label: "Type:", value: selectedNode.type },
          { label: "State:", value: selectedNode.state },
          { label: "Team:", value: selectedNode.team },
          { label: "Sprint:", value: selectedNode.sprint },
          { label: "Risk Score:", value: `${selectedNode.riskScore}%` }
        ];
        
        details.forEach((detail, i) => {
          infoPanel.append("text")
            .attr("x", 20)
            .attr("y", 55 + (i * 18))
            .text(detail.label)
            .attr("font-weight", "500")
            .attr("fill", "#333");
            
          infoPanel.append("text")
            .attr("x", 100)
            .attr("y", 55 + (i * 18))
            .text(detail.value)
            .attr("fill", detail.label === "Risk Score:" && selectedNode.riskScore >= 70 ? "#D13438" : 
                   detail.label === "Risk Score:" && selectedNode.riskScore >= 40 ? "#FFAA44" : "#555");
        });
      }
    }

    // Add click handler on background to clear selection
    svg.on("click", () => {
      setSelectedNode(null);
    });

    // Update positions on each tick of the simulation
    simulation.on("tick", () => {
      // Update link positions with curved paths
      link.attr("d", linkArc);
      
      // Update node positions
      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
      
      // Update selected node info
      updateSelectedNodeInfo();
    });

    // Helper function to get node radius based on importance
    function getNodeRadius(d: any) {
      if (d.id === 1) return 30; // Main/root node
      if (d.id <= 5) return 25; // Important nodes
      return 20; // Regular nodes
    }

    // Helper function to get node icon based on type
    function getNodeIcon(type: string) {
      switch (type.toLowerCase()) {
        case 'epic':
          return 'E';
        case 'user story':
          return 'US';
        case 'task':
          return 'T';
        case 'bug':
          return 'B';
        default:
          return '';
      }
    }

    // Drag functions
    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    // Add legend with enhanced styling
    const legend = svg.append("g")
      .attr("transform", `translate(${width - 150}, ${height - 120})`)
      .attr("class", "legend");

    // Add background for the legend
    legend.append("rect")
      .attr("width", 140)
      .attr("height", 110)
      .attr("fill", "rgba(255, 255, 255, 0.9)")
      .attr("stroke", "#ddd")
      .attr("rx", 8)
      .attr("ry", 8);

    legend.append("text")
      .attr("x", 10)
      .attr("y", 20)
      .text("Dependency Status")
      .style("font-size", "12px")
      .style("font-weight", "bold");

    // Add legend items with better visual design
    const legendItems = [
      { color: "#0078D4", text: "Normal", riskLevel: "Low Risk" },
      { color: "#FFAA44", text: "Warning", riskLevel: "Medium Risk" },
      { color: "#D13438", text: "Critical", riskLevel: "High Risk" }
    ];

    legendItems.forEach((item, i) => {
      const g = legend.append("g")
        .attr("transform", `translate(10, ${35 + i * 25})`);
        
      // Risk color indicator
      g.append("rect")
        .attr("width", 12)
        .attr("height", 12)
        .attr("rx", 2)
        .attr("fill", item.color);
        
      // Status label
      g.append("text")
        .attr("x", 20)
        .attr("y", 10)
        .text(item.text)
        .style("font-size", "11px")
        .style("font-weight", "500");
        
      // Risk description
      g.append("text")
        .attr("x", 75)
        .attr("y", 10)
        .text(item.riskLevel)
        .style("font-size", "10px")
        .style("fill", "#666");
    });

    // Add some animation effects when we update
    svg.selectAll(".node")
      .style("opacity", 0)
      .transition()
      .duration(500)
      .style("opacity", 1);

    // Watch for selected node changes
    updateSelectedNodeInfo();

    return () => {
      simulation.stop();
    };
  }, [graphData, zoomLevel, selectedNode, highlightMode]);

  return (
    <div className="xl:col-span-2">
      <Card className="mb-6 overflow-hidden">
        <div className="p-5 border-b border-neutral-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <h3 className="text-xl font-bold bg-gradient-to-r from-primary to-indigo-500 text-transparent bg-clip-text">
              Dependency Graph
            </h3>
            <Tabs 
              value={highlightMode}
              onValueChange={(value) => setHighlightMode(value as 'all' | 'high-risk' | 'critical-path')}
              className="w-full md:w-auto"
            >
              <TabsList className="grid grid-cols-3 w-full md:w-auto">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="high-risk">High Risk</TabsTrigger>
                <TabsTrigger value="critical-path">Critical Path</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handleZoomIn}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleZoomOut}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleResetZoom}>
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleExportGraph}>
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="default" size="sm" onClick={handleRefresh} className="bg-primary hover:bg-primary/90">
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
        <div className="relative p-2 h-[500px] flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
          {isLoading ? (
            <div className="text-neutral-500 flex flex-col items-center">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
              <div>Loading dependency graph...</div>
            </div>
          ) : error ? (
            <div className="text-error">Error loading graph: {(error as Error).message}</div>
          ) : !graphData?.nodes?.length ? (
            <div className="text-neutral-500">No dependency data available</div>
          ) : (
            <>
              {/* Add the animation keyframes for the dashed lines */}
              <style>{`
                @keyframes dash {
                  to {
                    stroke-dashoffset: 20;
                  }
                }
              `}</style>
              <svg ref={svgRef} className="w-full h-full cursor-move"></svg>
              {/* Instruction tooltip */}
              <div className="absolute bottom-2 left-2 bg-white/90 p-2 rounded-md text-xs shadow-sm border border-gray-200">
                <p className="font-medium text-gray-700">Tip: Drag nodes to reposition. Click on a node for details.</p>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};

export default DependencyGraph;
