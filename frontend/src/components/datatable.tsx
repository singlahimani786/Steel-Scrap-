'use client'
import { DataTable } from "./data-table" 
import { Payment,columns } from "./columns"

export default  function DaataTable(){
    return (
        <div className="container mx-auto py-10">
          <DataTable columns={columns} data={[]} />
        </div>
      )
}