import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_dashboardLayout/ambil-ujian')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_dashboardLayout/ambil-ujian"!</div>
}
