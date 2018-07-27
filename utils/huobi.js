const Agent = require('socks5-https-client/lib/Agent');
const crypto = require('crypto');
const moment = require('moment');
const _ = require('lodash');
const { secretKey, accessKey } = require('../security');

const DEFAULT_HTTP_METHOD = 'GET';
const DEFAULT_API_URL = '/v1/order/orders';
const HUOBI_API_PROTOCOL = 'https://';
const HUOBI_API_DOMAIN = 'api.huobi.pro';

/**
 * 
 * @param {Object} query    an OBJECT of query-dict, default: {}, 
 *                          eg. {"user-id": '123456', "symbol": 'btcusdt'}
 * @return {String}
 */ 
function getQueryStr(query){
    if(query != null && typeof query != 'object'){
        throw new Error('[ERROR]: signature\'s param must be an object!');
    }

    let extendedQuery = {
        "AccessKeyId": accessKey,
        "SignatureMethod": "HmacSHA256",
        "SignatureVersion": 2,
        "Timestamp": moment.utc().format('YYYY-MM-DDTHH:mm:ss')
    };

    Object.assign(extendedQuery, query)

    //for the convenience to handle data
    //we need to change obj 2 arr
    let queryArr = obj2ArrayObj(extendedQuery);
    
    //sort for signature
    return queryArr.map(p=> p.key + "=" + encodeURIComponent(p.value))
                .sort()
                .join("&");
}

/**
 * 
 * @param {Object} params {
 *                           method -> HTTP METHOD, one of 'GET' or 'POST', default: 'GET',
 *                           url -> the relative url to request, default: '/v1/order/orders',
 *                           queryStr -> string generated by getQueryStr(), MUST!
 *                        }
 * @return {String}
 */
function signature(params){
    if(params != null && typeof params != 'object'){
        throw new Error('[ERROR]: signature\'s param must be an object!');
    }

    let defaultParams = {
        method: DEFAULT_HTTP_METHOD,
        url: DEFAULT_API_URL,
        domain: HUOBI_API_DOMAIN,
    }
    let _params = Object.assign(defaultParams, params);

    const strToSecret = [_params.method, _params.domain, _params.url, _params.queryStr].join("\n");
    return crypto.createHmac("sha256", secretKey).update(strToSecret).digest('base64');
}
/**
 * 
 * @param {Object} options {
 *                           url -> the relative api url, default: '/v1/order/orders',
 *                           method -> HTTP METHOD, one of 'GET' or 'POST', default: 'GET',
 *                           queryStr -> string generated by getQueryStr()
 *                           body -> an object for POST's body, eg. {'user-id': '123456'}
 *                        }
 * @return {Object}
 */
function getRequestOpt({url, method, queryStr, body}){
    url = HUOBI_API_PROTOCOL + HUOBI_API_DOMAIN + url + '?' + queryStr;
    return {
        url,
        method,
        body,
        headers: {
            "Content-Type": "application/json",
            'Accept-Language': 'zh-cn',
            "User-Agent": "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.71 Safari/537.36"
        },
        agentClass: Agent,
        strictSSL: true,
        json: true
    }
}

/**
 * 
 * @param {Object} options {
 *                           url -> the relative api url, default: '/v1/order/orders',
 *                           method -> HTTP METHOD, one of 'GET' or 'POST', default: 'GET',
 *                           query -> string generated by getQueryStr()
 *                           body -> an object for POST's body, eg. {'user-id': '123456'}
 *                        }
 * @return {Object}
 */
exports.huobiHandle = ({url, method, query, body}) => {
    if(!url) url = DEFAULT_API_URL;
    if(!method) method = DEFAULT_HTTP_METHOD;

    let queryStr = getQueryStr(query);
    const signatureStr = signature({method, url, queryStr});
    queryStr += '&Signature=' + encodeURIComponent(signatureStr);
    return getRequestOpt({url, method, queryStr, body});
}

function obj2ArrayObj(obj){
    if(typeof obj != 'object'){
        throw new Error('[ERROR]: signature\'s param must be an object!');
    }
    let arr = [];
    for(let key in obj){
        if(obj.hasOwnProperty(key)){
            arr.push({
                key,
                value: obj[key]
            })
        }
    }
    return arr;
}