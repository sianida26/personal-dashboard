import PageTemplateV2 from '@/components/PageTemplate'
import { Button } from '@/components/ui/button'
import client from '@/honoClient'
import createActionButtons from '@/utils/createActionButton'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { TbEye, TbPencil, TbTrash } from 'react-icons/tb'

export const Route = createFileRoute('/_dashboardLayout/dev')({
  component: RouteComponent,
})

// TODO: Make this page inacessible

function RouteComponent() {
  const navigate = useNavigate()

  return (
    <PageTemplateV2
      endpoint={client.users.$get}
      title="aaa"
      columnDefs={(helper) => [
        helper.display({
          header: '#',
          cell: (props) => props.row.index + 1,
        }),
        helper.accessor('name', {
          cell: (info) => info.getValue(),
          header: ({ column }) => {
            return (
              <Button
                variant="ghost"
                onClick={() =>
                  column.toggleSorting(column.getIsSorted() === 'asc')
                }
              >
                Name
              </Button>
            )
          },
        }),
        helper.accessor('username', {
          cell: (info) => info.getValue(),
          header: 'Username',
        }),
        helper.accessor('isEnabled', {
          cell: (info) =>
            info.getValue() ? (
              <span className="text-green-500">Active</span>
            ) : (
              <span className="text-gray-500">Inactive</span>
            ),
          header: 'Status',
        }),
        helper.display({
          header: 'Actions',
          cell: (props) => (
            <div className="flex gap-2">
              {createActionButtons([
                {
                  label: 'Detail',
                  permission: true,
                  action: `./detail/${props.row.original.id}`,
                  className: 'bg-green-500 hover:bg-green-600',
                  icon: <TbEye />,
                },
                {
                  label: 'Edit',
                  permission: true,
                  action: `./edit/${props.row.original.id}`,
                  className: 'bg-yellow-500 hover:bg-yellow-600',
                  icon: <TbPencil />,
                },
                {
                  label: 'Delete',
                  permission: true,
                  action: () =>
                    navigate({
                      to: '/users/delete/$userId',
                      params: {
                        userId: props.row.original.id,
                      },
                    }),
                  variant: 'outline',
                  className:
                    'border-red-500 text-red-500 hover:bg-red-500 hover:text-white',
                  icon: <TbTrash />,
                },
              ])}
            </div>
          ),
        }),
      ]}
    />
  )
}
