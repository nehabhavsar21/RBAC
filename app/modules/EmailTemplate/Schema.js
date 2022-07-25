const mongoose = require('mongoose');
let schema = mongoose.Schema;

const emailSchema = new mongoose.Schema({
    emailTitle: { type: String, required: true },
    createdById: { type: schema.Types.ObjectId, ref: 'Admin' },
    createdBy: { type: String },
    fromEmailId: { type: String },
    emailKey: { type: String, required: true, unique: true },
    emailContent: { type: String, required: true },
    subject: { type: String, required: true },
    gjsHtml: { type: String },
    gjsCss: { type: String },
    gjsAssets: { type: String },
    gjsStyles: { type: String },
    gjsComponents: { type: String },
    status: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false }
}, {
        timestamps: true
    });
let EmailTemplate = mongoose.model('emailTemplate', emailSchema);
module.exports = {
    EmailTemplate
}