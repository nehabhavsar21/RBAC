const ObjectId = require('mongodb').ObjectID;
const _ = require("lodash");
const i18n = require("i18n");

const Controller = require("../Base/Controller");
const PermissionsSchema = require('./Schema').PermissionsSchema;
const RolesSchema = require('./Schema').RolesSchema;
const PermissionCategorysSchema = require('./Schema').PermissionCategorysSchema;
const RequestBody = require("../../services/RequestBody");
const Projection = require('./Projection');
const Model = require("../Base/Model");
const CommonService = require("../../services/Common");

class RolesController extends Controller {

    constructor() {
        super();
    }

    /********************************************************
    Purpose: Permission Category add /update
    Parameter:
    {
        "category": "Admin Users"
    }
    Return: JSON String
    ********************************************************/
    async addPermissionCategory() {
        try {
            let filter = this.req.body.id ? { category: this.req.body.category, _id: { $ne: this.req.body.id } } : { category: this.req.body.category };
            let categoryExist = await PermissionCategorysSchema.findOne(filter);
            if (categoryExist) {
                return this.res.send({ status: 0, message: i18n.__("CATEGORY_EXIST") });
            }
            if (this.req.body.id) {
                let updatedCategory = await PermissionCategorysSchema.findOneAndUpdate({ _id: this.req.body.id }, { category: this.req.body.category }, { new: true });
                return this.res.send({ status: 1, data: updatedCategory });
            } else {
                let category = await new Model(PermissionCategorysSchema).store({ category: this.req.body.category });
                return this.res.send({ status: 1, data: category });
            }

        } catch (error) {
            console.log(error);
            this.res.send({ status: 0, message: error });
        }
    }

    /********************************************************
    Purpose: Get Permission Category 
    Parameter:
    {}
    Return: JSON String
    ********************************************************/
    async getCategory() {
        try {
            let categories = await PermissionCategorysSchema.find({ status: true }).select(Projection.permissionCatrgory);
            return this.res.send({ status: 1, data: categories });
        } catch (error) {
            console.log(error);
            this.res.send({ status: 0, message: error });
        }
    }

    /********************************************************
    Purpose:Role permissions add /update
    Parameter:
    {
        "categoryId": "5d25ecdf31f21b0f0ae96ba3",
        "permission": "view"
    }
    Return: JSON String
    ********************************************************/
    async addPermissions() {
        try {
            let isCategoryExist = await PermissionCategorysSchema.findOne({ _id: this.req.body.categoryId });
            if (isCategoryExist) {
                let filter = this.req.body.id ? { categoryId: this.req.body.categoryId, permission: this.req.body.permission, _id: { $ne: this.req.body.id } } : { categoryId: this.req.body.categoryId, permission: this.req.body.permission };
                const isPermissionExist = await PermissionsSchema.findOne(filter);
                if (isPermissionExist) {
                    return this.res.send({ status: 0, message: i18n.__("PERMISSION_EXIST_FOR_THIS_CATEGORY") });
                }
                this.req.body['permissionKey'] = isCategoryExist.category.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase() + '_' + this.req.body['permission'].replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
                if (this.req.body.id) {
                    let id = this.req.body.id;
                    delete this.req.body.id;
                    let updated = await PermissionsSchema.findOneAndUpdate({ _id: id, categoryId: this.req.body.categoryId }, this.req.body, { new: true });
                    if (!updated) {
                        return this.res.send({ status: 0, message: i18n.__("PERMISSION_NOT_FOUND") });
                    }
                } else {
                    await new Model(PermissionsSchema).store(this.req.body);
                }
                let permissions = await PermissionsSchema.find().select(Projection.permission);
                return this.res.send({ status: 1, data: permissions });
            } else {
                return this.res.send({ status: 0, message: i18n.__("CATEGORY_NOT_FOUND") });
            }

        } catch (error) {
            console.log(error);
            this.res.send({ status: 0, message: error });
        }
    }

    /********************************************************
    Purpose: Get All Role permissions
    Parameter:
    {}
    Return: JSON String
    ********************************************************/
    async getAllPermission() {
        try {
            let stages = await this.permissionAggregationStages();
            let permissions = await PermissionsSchema.aggregate(stages);
            console.log('permissions',permissions)
            _.map(permissions, (permission) => {
                permission.category = permission._id.category;
                permission.categoryId = permission._id._id;
                delete permission._id;
            });
            return this.res.send({ status: 1, data: permissions });
        } catch (error) {
            console.log(error);
            this.res.send({ status: 0, message: error });
        }
    }

    /********************************************************
   Purpose:Role add /update
   Parameter:
   {
       "role": "Email Manager",
       "permissions": ["5d5654c1a8fe610d46c68a42","5d5654c1a8fe610d46c68a42"]
   }
   Return: JSON String
   ********************************************************/
    async addRole() {
        try {
            let filter = this.req.body.id ? { role: this.req.body.role, _id: { $ne: this.req.body.id } } : { role: this.req.body.role };
            let roleExist = await RolesSchema.findOne(filter);
            if (roleExist) {
                return this.res.send({ status: 0, message: i18n.__("ROLE_EXIST") });
            }
            let role = {};
            if (this.req.body.id) {
                role = await RolesSchema.findOneAndUpdate({ _id: this.req.body.id }, this.req.body, { new: true });
                if (!role) {
                    return this.res.send({ status: 0, message: i18n.__("ROLE_NOT_FOUND") });
                }
            } else {
                role = await new Model(RolesSchema).store(this.req.body);
            }
            return this.res.send({ status: 1, data: role });
        } catch (error) {
            console.log(error);
            this.res.send({ status: 0, message: error });
        }
    }

    /********************************************************
   Purpose:Role List
   Parameter:
   {
        "page": 1,
        "pageSize": 10,
        "columnKey":"roleListing",
        "filter": [{ status: [true] }]
   }
   Return: JSON String
   ********************************************************/
    async listRoles() {
        try {
            this.req.body['model'] = RolesSchema;
            this.req.body['adminId'] = this.req.currentUser._id;
            let data = { bodyData: this.req.body, selectObj: Projection.roleList }
            /**** if search is required ******/
            if (this.req.body.searchText) {
                data.fieldsArray = ['role']
                data.searchText = this.req.body.searchText;
            }
            let result = await new CommonService().listing(data);
            return this.res.send(result);
        }
        catch (error) {
            console.log(error);
            this.res.send({ status: 0, message: error });
        }
    }

    /********************************************************
   Purpose: Role details
   Parameter:
   {
       "roleId": ""
   }
   Return: JSON String
   *******************************************************/
    async getRolePermission() {
        try {
            let stages = await this.permissionAggregationStages();
            let categoryPermissions = await PermissionsSchema.aggregate(stages);
            _.map(categoryPermissions, (permission) => {
                permission.category = permission._id.category;
                delete permission._id;
            });
            if (this.req.params.roleId && this.req.params.roleId != '{roleId}' && this.req.params.roleId !== 'undefined') {
                let role = await RolesSchema.findOne({ _id: this.req.params.roleId, isDeleted: false });
                if (role) {
                    if (role.permissions) {
                        let rolePermissions = _.map(role.permissions, (permission) => { return permission.toString() });
                        _.map(categoryPermissions, (permission) => {
                            _.map(permission.permissions, (per) => {
                                if (_.includes(rolePermissions, per._id.toString())) {
                                    per.isSelected = true;
                                }
                            });
                        });
                    }
                    let roleDetails = { _id: role._id, role: role.role, status: role.status, categoryPermissions: categoryPermissions };
                    return this.res.send({ status: 1, data: roleDetails });
                } else {
                    return this.res.send({ status: 0, message: i18n.__("ROLE_NOT_FOUND") });
                }
            } else {
                let roleDetails = { categoryPermissions: categoryPermissions };
                return this.res.send({ status: 1, data: roleDetails });
            }


        }
        catch (error) {
            console.log(error);
            this.res.send({ status: 0, message: error });
        }
    }

    /********************************************************
     Purpose: single and multiple role 's change status
     Parameter:
     {
        "ids":["5ad5d198f657ca54cfe39ba0","5ad5da8ff657ca54cfe39ba3"],
        "status":true
     }
     Return: JSON String
     ********************************************************/
    async changeStatus() {
        try {
            let msg = 'Role not updated.';
            const updatedRole = await RolesSchema.updateMany({ _id: { $in: this.req.body.ids } }, { $set: { status: this.req.body.status } });
            if (updatedRole) {
                msg = updatedRole.nModified ? updatedRole.nModified + ' roles updated.' : updatedRole.n == 0 ? i18n.__("ROLE_NOT_FOUND") : msg;
            }
            return this.res.send({ status: 1, message: msg });
        } catch (error) {
            console.log("error- ", error);
            this.res.send({ status: 0, message: error });
        }
    }

    /********************************************************
     Purpose:Delete Roles
     Parameter:
     {
           ids:['82748049082','2343982uioew3028']
     }
     Return: JSON String
     ********************************************************/
    // async deleteRole() {
    //     try {
    //         let msg = 'Role not deleted.';
    //         const updatedRole = await RolesSchema.updateMany({ _id: { $in: this.req.body.ids } }, { $set: { isDeleted: true } });
    //         if (updatedRole) {
    //             msg = updatedRole.nModified ? updatedRole.nModified + ' role deleted.' : updatedRole.n == 0 ? i18n.__("ROLE_NOT_FOUND") : msg;
    //         }
    //         return this.res.send({ status: 1, message: msg });
    //     } catch (error) {
    //         this.res.send({ status: 0, message: error });
    //     }
    // }
    async permissionAggregationStages() {
        return new Promise((resolve, reject) => {
            try {
                let stages = [
                    {
                        $lookup: {
                            from: "permissioncategories",
                            localField: "categoryId",
                            foreignField: "_id",
                            as: "category"
                        }
                    },
                    { "$unwind": "$category" },
                    // { $match: { "category.status": true, "status": true } },
                    {
                        $group:
                        {
                            _id: "$category",
                            permissions: { $push: { permission: "$permission", _id: "$_id" } },
                        }
                    },
                    { $project: Projection.permissionAggregate }
                ];
                return resolve(stages);
            } catch (error) {
                return reject(error);
            }
        });
    }

}
module.exports = RolesController;