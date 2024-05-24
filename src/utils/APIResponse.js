class ApiResponse{
    constructor(statusCode,data,message = "Success"){
        this.statusCode=statusCode
        this.data=data
        this.message=message
        console.log(statusCode)
    }
}

export {ApiResponse}