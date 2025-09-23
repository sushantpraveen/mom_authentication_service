class BaseController {
    success(res, data, message) {
        console.log("hi");
        return res.status(200).json({ data, message });
    }

    error(res, status, message , error) {
        return res.status(status).json({ message ,  error });
    }
}

module.exports = BaseController;
