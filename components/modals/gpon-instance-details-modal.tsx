"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface GponInstanceDetailsModalProps {
  instance: any
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GponInstanceDetailsModal({ instance, open, onOpenChange }: GponInstanceDetailsModalProps) {
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{instance?.name}</DialogTitle>
          <DialogDescription>GPON Instance Details - {instance?.client}</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="olts">OLTs & Ports</TabsTrigger>
            <TabsTrigger value="equipment">Equipment</TabsTrigger>
            <TabsTrigger value="snmp">SNMP Events</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Instance Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-medium">{instance?.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Type:</span>
                    <Badge variant="outline" className="text-xs">
                      {instance?.type}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant="outline" className="text-xs bg-chart-4/20 text-chart-4 border-0">
                      {instance?.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Created:</span>
                    <span className="font-medium">2024-09-15</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Resources</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>CPU</span>
                      <span className="font-medium">{instance?.cpu}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded h-2">
                      <div className="bg-chart-1 h-2 rounded" style={{ width: `${instance?.cpu}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Memory</span>
                      <span className="font-medium">{instance?.memory}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded h-2">
                      <div className="bg-accent h-2 rounded" style={{ width: `${instance?.memory}%` }} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* OLTs & Ports Tab */}
          <TabsContent value="olts" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">OLT Configuration</CardTitle>
                <CardDescription>Optical Line Terminal slots and ports</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>OLT ID</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>Slots</TableHead>
                      <TableHead>Ports</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      { id: "OLT-001", model: "GPON-3000", slots: 8, ports: 128, status: "active" },
                      { id: "OLT-002", model: "GPON-2000", slots: 4, ports: 64, status: "active" },
                      { id: "OLT-003", model: "GPON-2000", slots: 4, ports: 64, status: "idle" },
                    ].map((olt) => (
                      <TableRow key={olt.id}>
                        <TableCell className="font-medium">{olt.id}</TableCell>
                        <TableCell>{olt.model}</TableCell>
                        <TableCell>{olt.slots}</TableCell>
                        <TableCell>{olt.ports}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs bg-chart-4/20 text-chart-4 border-0">
                            {olt.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Equipment Tab */}
          <TabsContent value="equipment" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Connected Equipment</CardTitle>
                <CardDescription>ONUs and CPEs connected to this instance</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Serial Number</TableHead>
                      <TableHead>Equipment Type</TableHead>
                      <TableHead>OLT/Port</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Signal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      { serial: "ONU-001-2024", type: "ONU", port: "OLT-001/1/1", status: "online", signal: "-21 dBm" },
                      { serial: "ONU-002-2024", type: "ONU", port: "OLT-001/1/2", status: "online", signal: "-19 dBm" },
                      { serial: "CPE-001-2024", type: "CPE", port: "OLT-002/1/3", status: "online", signal: "-23 dBm" },
                      { serial: "ONU-003-2024", type: "ONU", port: "OLT-001/1/4", status: "offline", signal: "N/A" },
                    ].map((eq) => (
                      <TableRow key={eq.serial}>
                        <TableCell className="font-mono text-xs">{eq.serial}</TableCell>
                        <TableCell>{eq.type}</TableCell>
                        <TableCell>{eq.port}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-xs border-0 ${eq.status === "online" ? "bg-chart-4/20 text-chart-4" : "bg-destructive/20 text-destructive"}`}
                          >
                            {eq.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{eq.signal}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SNMP Events Tab */}
          <TabsContent value="snmp" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Recent SNMP Events</CardTitle>
                <CardDescription>Last 20 network events detected</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {[
                    { time: "14:35:22", severity: "info", event: "ONU-001-2024 link up" },
                    { time: "14:32:15", severity: "warning", event: "OLT-001/1/5 power degradation" },
                    { time: "14:28:03", severity: "error", event: "CPE-001-2024 offline" },
                    { time: "14:25:41", severity: "info", event: "Temperature normal - 38°C" },
                    { time: "14:20:18", severity: "info", event: "Backup configuration completed" },
                  ].map((ev, idx) => (
                    <div key={idx} className="flex gap-3 p-2 rounded bg-secondary text-sm">
                      <span className="text-muted-foreground min-w-fit">{ev.time}</span>
                      <Badge
                        variant="outline"
                        className={`text-xs min-w-fit ${
                          ev.severity === "error"
                            ? "bg-destructive/20 text-destructive"
                            : ev.severity === "warning"
                              ? "bg-chart-3/20 text-chart-3"
                              : "bg-chart-4/20 text-chart-4"
                        } border-0`}
                      >
                        {ev.severity.toUpperCase()}
                      </Badge>
                      <span className="text-foreground flex-1">{ev.event}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
