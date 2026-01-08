// controllers/worklogController.js
const worklogService = require("../services/worklogService");
const { CreateWorklogDTO } = require("../dtos/worklogDto");
const path = require("path");
const fs = require("fs");

class WorklogController {
    create = async (req, res, next) => {
        try {
            // req.file จะมาจากการที่ Multer ทำงานสำเร็จแล้ว
            const dto = new CreateWorklogDTO(req.body);
            dto.validate();

            const result = await worklogService.createWorklog(req.user.id, dto, req.file);
            res.status(201).json({ status: 'success', data: result });
        } catch (error) { next(error); }
    }

    getAll = async (req, res, next) => {
        try {
            const worklogs = await worklogService.getMyWorklogs(req.user.id);
            // แปลง image_path เป็น Full URL Endpoint
            const data = worklogs.map(log => ({
                ...log,
                imageUrl: log.image_path ? `${req.protocol}://${req.get('host')}/api/worklogs/image/${log.image_path}` : null
            }));
            res.status(200).json({ status: 'success', data: data });
        } catch (error) { next(error); }
    }

    getOne = async (req, res, next) => {
        try {
            const { id } = req.params;
            // เรียกใช้ Service ตัวเดิมที่มีอยู่แล้ว (มันเช็ค User ID ให้ด้วย ปลอดภัยหายห่วง)
            const worklog = await worklogService.getWorklogById(id, req.user.id);

            // แปลง image_path เป็น Full URL ให้ Frontend ใช้ง่ายๆ
            const data = {
                ...worklog,
                imageUrl: worklog.image_path 
                    ? `${req.protocol}://${req.get('host')}/api/worklogs/image/${worklog.image_path}` 
                    : null
            };

            res.status(200).json({ status: 'success', data });
        } catch (error) { next(error); }
    }

    update = async (req, res, next) => {
        try {
            const { id } = req.params;
            const result = await worklogService.updateWorklog(id, req.user.id, req.body, req.file);
            res.status(200).json({ status: 'success', data: result });
        } catch (error) { next(error); }
    }

    delete = async (req, res, next) => {
        try {
            await worklogService.deleteWorklog(req.params.id, req.user.id);
            res.status(204).json({ status: 'success', message: 'Worklog deleted' });
        } catch (error) { next(error); }
    }

    // Endpoint สำหรับเสิร์ฟรูปภาพ
    getImage = (req, res) => {
        const { filename } = req.params;
        const filePath = path.join("uploads", filename);

        if (fs.existsSync(filePath)) {
            res.sendFile(path.resolve(filePath));
        } else {
            res.status(404).json({ error: "Image not found" });
        }
    }
}

module.exports = new WorklogController();