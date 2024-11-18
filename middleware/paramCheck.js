const checkParams = (req, res, next) => {
    // Check if there are any query or path parameters
    
    if (Object.keys(req.query).length > 0 || Object.keys(req.params).length > 0) {
        return res.status(400).end();
    }
    next(); 
};

const checkBodyContent = (req, res, next) => {
    // Check if the request body is empty
    if (Object.keys(req.body).length != 0) {
        return res.status(400).end();
    }
    next(); 
};


module.exports={checkParams,checkBodyContent}

