const crypto = require('crypto');
const { secret, accessKey } = require('../security');
const moment = require('moment');

const baseURL = "https://api.huobi.pro";

if(!Date.prototype.Format){
    Date.prototype.Format = function (fmt) { //author: meizz
        var o = {
        "M+": this.getMonth() + 1, //月份
        "d+": this.getDate(), //日
        "h+": this.getHours(), //小时
        "m+": this.getMinutes(), //分
        "s+": this.getSeconds(), //秒
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度
        "S": this.getMilliseconds() //毫秒
        };
        if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
        for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
        return fmt;
    }
}


function formatNow(){
    const date = new Date();
    return date.Format('yyyy-MM-ddThh:mm:ss');
}

function getSignatureParamInfo(){
    return [{
        "key": "AccessKeyId",
        "value": accessKey
    },{
        "key": "SignatureMethod",
        "value": "HmacSHA256",
    },{
        "key": "SignatureVersion",
        "value": 2,
    },{
        "key": "Timestamp",
        "value": moment.utc().format('YYYY-MM-DDTHH:mm:ss')
    }];
}

exports.getOption = (url, method, form) => {
    if(!method) method = 'GET';
    return {
        method,
        url: baseURL + url,
        strictSSL: true,
        headers: {
            "Content-Type": "application/json",
            'Accept-Language': 'zh-cn',
            "User-Agent": "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.71 Safari/537.36"
        },
        json: true,
        body: form
    }
}

exports.signature = (params) => {
    if(!params) params = {};

    if(!params.method){ params.method = 'GET'; }
    if(!params.baseUrl){ params.baseUrl = 'api.huobi.pro'; }
    if(!params.url){ params.url = '/v1/order/orders'; }
    if(!params.paramsArray){ params.paramsArray = []; }
    params.paramsArray = params.paramsArray.concat(getSignatureParamInfo());    

    const paramsStr = params.paramsArray.map(p=> p.key + "=" + encodeURIComponent(p.value));
    let paramStr = paramsStr.sort().join("&");

    const str = [params.method, params.baseUrl, params.url, paramStr].join("\n");

    let signature = crypto.createHmac("sha256", secret).update(str).digest('base64');
    return params.url + "?" + paramStr + "&Signature=" + encodeURIComponent(signature);
}
