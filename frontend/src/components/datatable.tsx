'use client'
import { DataTable } from "./data-table" 
import { AnalysisRecord, columns } from "./columns"

interface DaataTableProps {
  data: AnalysisRecord[];
}

export default function DaataTable({ data }: DaataTableProps) {
  return (
    <div className="container mx-auto py-10">
      <DataTable 
        columns={columns} 
        data={data} 
        filterColumn="truck_number"
        filterPlaceholder="Filter by truck number or scrap type..."
      />
    </div>
  );
}