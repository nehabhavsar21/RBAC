/****************************
 Common services
 ****************************/
const _ = require("lodash");
const i18n = require("i18n");

const RolesSchema = require('./Schema').RolesSchema;
const PermissionsSchema = require('./Schema').PermissionsSchema;


class RoleService {

    /********************************************************
     Purpose:Service for error handling
     Parameter:
     {
         userData: {}
     }
     Return: JSON String
     ********************************************************/
    getPermissionsOfUser(userData) {
        return new Promise(async (resolve, reject) => {
            try {
                let roleId = userData.roleId;

                let permissions = await PermissionsSchema.find().populate('categoryId', { category: 1 }).select({ permissionKey: 1, permission: 1 });
                let role = await RolesSchema.findOne({ _id: roleId }).populate('permissions', { permissionKey: 1 });
                let rolePermission = role && role.permissions ? _.map(role.permissions, 'permissionKey') : [];
                let userPermissions = {};
                await this.asyncForEach(permissions, async (permission) => {
                    if (permission.categoryId && permission.categoryId.category && permission.permission) {
                        let category = permission.categoryId.category.replace(/(?:_| |\b)(\w)/g, (str, p1) => { return p1.toUpperCase() });
                        let per = permission.permission.replace(/(?:_| |\b)(\w)/g, (str, p1) => { return p1.toUpperCase() });

                        category = category.charAt(0).toLowerCase() + category.slice(1);
                        per = per.charAt(0).toLowerCase() + per.slice(1);

                        if (userPermissions[category + 'Access']) {
                            userPermissions[category + 'Access'][per] = _.includes(rolePermission, permission.permissionKey) ? true : false;
                        } else {
                            userPermissions[category + 'Access'] = { [per]: _.includes(rolePermission, permission.permissionKey) ? true : false };
                        }
                    }
                });
                return resolve(userPermissions);
            } catch (error) {
                return reject({ status: 0, message: error });
            }
        });
    }
    async asyncForEach(array, callback) {
        for (let index = 0; index < array.length; index++) {
            await callback(array[index], index, array);
        }
    }
}

module.exports = RoleService;