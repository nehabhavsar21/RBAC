const mongoose = require('mongoose');
let Schema = require('mongoose').Schema;

const roleSchema = new mongoose.Schema({
    role: { type: String },
    permissions: [{ type: Schema.Types.ObjectId, ref: 'Permissions', required: true }],
    nestedRoles: [{ type: Schema.Types.ObjectId, ref: 'Roles' }],
    status: { type: Boolean, default: true },
    routes: { type: Array },
    isDeleted: { type: Boolean, default: false }
}, {
    timestamps: true
});

let RolesSchema = mongoose.model('Roles', roleSchema);

const permissionSchema = new mongoose.Schema({
    permission: { type: String },
    permissionKey: { type: String, unique: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'PermissionCategory', required: true },
    nestedPermissions: [{ type: Schema.Types.ObjectId, ref: 'Permissions' }],
    rule: [{ type: Schema.Types.ObjectId, ref: 'Rules' }],
    routes: { type: Array },
    status: { type: Boolean, default: true }
}, {
    timestamps: true
});

// permissionSchema.index({ permissionKey: 1, categoryId: 1 }, { unique: true });
let PermissionsSchema = mongoose.model('Permissions', permissionSchema);

const permissionCategorySchema = new mongoose.Schema({
    category: { type: String, unique: true },
    status: { type: Boolean, default: true }
}, {
    timestamps: true
});

let PermissionCategorysSchema = mongoose.model('PermissionCategory', permissionCategorySchema);

const ruleSchema = new mongoose.Schema({
    rule: { type: String },
    ruleKey: { type: String, unique: true },
    status: { type: Boolean, default: true },
    className: { type: String }
}, {
    timestamps: true
});
let RulesSchema = mongoose.model('Rules', ruleSchema);

module.exports = {
    PermissionsSchema,
    RolesSchema,
    roleSchema,
    PermissionCategorysSchema,
    RulesSchema
}