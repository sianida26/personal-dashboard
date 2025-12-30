import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute(
  '/_dashboardLayout/ambil-ujian/start/$ujianId',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_dashboardLayout/ambil-ujian/start/$ujianId"!</div>
}
