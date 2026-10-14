<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ItemOption extends Model
{
    protected $fillable = ['menu_item_id', 'type', 'name', 'display_order'];
}
