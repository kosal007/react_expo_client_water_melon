import { appSchema, tableSchema } from '@nozbe/watermelondb';

const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'products',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'price', type: 'number' },
        { name: 'deleted', type: 'boolean' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
  ],
});

export default schema;
