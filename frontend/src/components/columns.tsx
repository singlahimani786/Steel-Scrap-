"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import { MoreHorizontal, Eye, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export type AnalysisRecord = {
  _id: string
  timestamp: string
  truck_number: string
  scrap_image: string
  plate_image: string
  scrap_predictions: any
  plate_predictions: any
  analysis_id: string
  estimated_weight?: number
  estimated_price?: number
  worker_id?: string
  processing_time?: number
  status?: string
}

export const columns: ColumnDef<AnalysisRecord>[] = [
  {
    accessorKey: "timestamp",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Date & Time
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const timestamp = row.getValue("timestamp") as string
      let date: Date
      
      // Handle different timestamp formats
      if (typeof timestamp === 'string') {
        // If it's already an IST timestamp string, parse it directly
        if (timestamp.includes('+05:30')) {
          date = new Date(timestamp)
        } else {
          // If it's UTC, convert to IST
          date = new Date(timestamp)
          date = new Date(date.getTime() + (5.5 * 60 * 60 * 1000))
        }
      } else {
        date = new Date(timestamp)
      }
      
      const formatted = date.toLocaleString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })
      return <div className="font-medium">{formatted}</div>
    },
  },
  {
    accessorKey: "truck_number",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Truck Number
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      return <div className="font-semibold text-blue-600">{row.getValue("truck_number") as string}</div>
    },
    enableColumnFilter: true,
  },
  {
    accessorKey: "scrap_predictions",
    header: "Scrap Analysis",
    cell: ({ row }) => {
      const predictions = row.getValue("scrap_predictions")
      // Extract the main prediction from the scrap analysis
      let scrapType = "Unknown"
      let confidence = 0
      
      if (predictions && Array.isArray(predictions)) {
        const topPrediction = predictions[0]
        if (topPrediction && topPrediction.class) {
          scrapType = topPrediction.class
          confidence = Math.round((topPrediction.confidence || 0) * 100)
        }
      }
      
      return (
        <div className="space-y-1">
          <div className="font-medium text-gray-900">{scrapType}</div>
          <div className="text-sm text-gray-500">Confidence: {confidence}%</div>
        </div>
      )
    },
  },
  {
    accessorKey: "scrap_image",
    header: "Scrap Image",
    cell: ({ row }) => {
      const imageName = row.getValue("scrap_image") as string
      return (
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="text-sm text-gray-600 truncate max-w-24">{imageName}</span>
        </div>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const record = row.original
     
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(record.truck_number)}
            >
              Copy truck number
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(record.analysis_id)}
            >
              Copy analysis ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Eye className="mr-2 h-4 w-4" />
              View details
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Download className="mr-2 h-4 w-4" />
              Download report
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
