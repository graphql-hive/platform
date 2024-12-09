import { PermissionPicker } from '@/components/shared/permission-picker';
import { ResourceLevel } from '@/components/shared/permission-picker/permissions';
import { Button } from '@/components/ui/button';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof PermissionPicker> = {
  title: 'Permission Picker',
  component: PermissionPicker,
};
export default meta;

// export default meta;
type Story = StoryObj<typeof PermissionPicker>;

export const Default: Story = {
  render: props => (
    <div className="p-5">
      <PermissionPicker
        {...props}
        resources={[
          {
            id: 'the-guild',
            level: ResourceLevel.organization,
            childResourceIds: ['the-guild/graphql-hive'],
          },
          {
            id: 'the-guild/graphql-hive',
            level: ResourceLevel.project,
            childResourceIds: [
              'the-guild/graphql-hive/production',
              'the-guild/graphql-hive/staging',
              'the-guild/graphql-hive/testing',
            ],
          },
          {
            id: 'the-guild/graphql-hive/production',
            level: ResourceLevel.target,
            childResourceIds: [],
          },
          {
            id: 'the-guild/graphql-hive/staging',
            level: ResourceLevel.target,
            childResourceIds: [],
          },
          {
            id: 'the-guild/graphql-hive/testing',
            level: ResourceLevel.target,
            childResourceIds: [],
          },
        ]}
      />
      <Button
        onClick={() => {
          localStorage.removeItem('hive:prototype:permissions');
        }}
        className="mt-8"
      >
        Reset Local Storage state
      </Button>
    </div>
  ),
};
