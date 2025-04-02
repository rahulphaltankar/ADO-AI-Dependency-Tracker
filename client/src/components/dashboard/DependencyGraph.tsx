import React, { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { graphApi } from '@/lib/api';
import { Card } from '@/components/ui/card';
import * as d3 from 'd3';

const DependencyGraph = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  
  const { data: graphData, isLoading, error } = useQuery({
    queryKey: ['/api/dependency-graph'],
    queryFn: graphApi.getDependencyGraph
  });

  useEffect(() => {
    if (!graphData || !svgRef.current) return;

    // Clear any existing content
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth || 800;
    const height = svgRef.current.clientHeight || 400;

    // Create a force simulation
    const simulation = d3.forceSimulation(graphData.nodes)
      .force("link", d3.forceLink(graphData.links)
        .id((d: any) => d.id)
        .distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius(30));

    // Create the links
    const link = svg.append("g")
      .selectAll("line")
      .data(graphData.links)
      .enter()
      .append("line")
      .attr("stroke", (d: any) => d.color)
      .attr("stroke-width", (d: any) => d.width || 1.5);

    // Create the nodes
    const node = svg.append("g")
      .selectAll("g")
      .data(graphData.nodes)
      .enter()
      .append("g")
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended)
      );

    // Add circles to the nodes
    node.append("circle")
      .attr("r", (d: any) => d.id === 1 ? 25 : (d.id <= 5 ? 20 : 15)) // Main node is larger
      .attr("fill", (d: any) => d.color);

    // Add labels to the nodes
    node.append("text")
      .text((d: any) => d.label)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("fill", "white")
      .style("font-size", (d: any) => d.id === 1 ? "12px" : (d.id <= 5 ? "12px" : "10px"));

    // Add title for tooltip
    node.append("title")
      .text((d: any) => `${d.adoId}: ${d.title}\nType: ${d.type}\nState: ${d.state}\nSprint: ${d.sprint}\nRisk: ${d.riskScore}%`);

    // Update positions on each tick of the simulation
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

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

    // Add legend
    const legend = svg.append("g")
      .attr("transform", `translate(${width - 120}, ${height - 80})`)
      .attr("class", "legend");

    // Add background for the legend
    legend.append("rect")
      .attr("width", 100)
      .attr("height", 70)
      .attr("fill", "white")
      .attr("stroke", "#C8C6C4")
      .attr("rx", 5);

    legend.append("text")
      .attr("x", 10)
      .attr("y", 15)
      .text("Legend")
      .style("font-size", "12px")
      .style("font-weight", "500");

    // Add legend items
    const legendItems = [
      { color: "#0078D4", text: "Normal" },
      { color: "#FFAA44", text: "Medium Risk" },
      { color: "#D13438", text: "High Risk" }
    ];

    legendItems.forEach((item, i) => {
      legend.append("circle")
        .attr("cx", 15)
        .attr("cy", 30 + i * 15)
        .attr("r", 5)
        .attr("fill", item.color);

      legend.append("text")
        .attr("x", 25)
        .attr("y", 33 + i * 15)
        .text(item.text)
        .style("font-size", "10px");
    });

    return () => {
      simulation.stop();
    };
  }, [graphData]);

  return (
    <div className="xl:col-span-2">
      <Card className="mb-6">
        <div className="p-5 border-b border-neutral-200">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Dependency Graph</h3>
            <div className="flex space-x-2">
              <button className="text-sm text-neutral-600 py-1 px-3 rounded border border-neutral-300 hover:bg-neutral-50">
                <span className="material-icons text-sm mr-1 align-text-bottom">file_download</span>
                Export
              </button>
              <button className="text-sm text-neutral-600 py-1 px-3 rounded border border-neutral-300 hover:bg-neutral-50">
                <span className="material-icons text-sm mr-1 align-text-bottom">fullscreen</span>
                Expand
              </button>
              <button className="text-sm text-white bg-primary py-1 px-3 rounded hover:bg-primary-dark">
                <span className="material-icons text-sm mr-1 align-text-bottom">refresh</span>
                Refresh
              </button>
            </div>
          </div>
        </div>
        <div className="relative p-5 h-96 flex items-center justify-center">
          {isLoading ? (
            <div className="text-neutral-500">Loading dependency graph...</div>
          ) : error ? (
            <div className="text-error">Error loading graph: {(error as Error).message}</div>
          ) : !graphData?.nodes?.length ? (
            <div className="text-neutral-500">No dependency data available</div>
          ) : (
            <svg ref={svgRef} className="w-full h-full"></svg>
          )}
        </div>
      </Card>
    </div>
  );
};

export default DependencyGraph;
