import { Model } from '@nozbe/watermelondb';
import { field, readonly, date } from '@nozbe/watermelondb/decorators';

export default class Product extends Model {
  static table = 'products';

  @field('name') name!: string;
  @field('price') price!: number;
  @field('deleted') deleted!: boolean;
  @readonly @date('updated_at') updatedAt!: Date;
}
