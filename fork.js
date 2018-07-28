/**
 *  * Created by zzl on 2017/1/8.
 *   
 */
const fork = require('child_process').fork;
const { pingPongLogger } = require('./utils/logger');

//保存被子进程实例数组
var workers = [];
//这里的被子进程理论上可以无限多
var appsPath = ['./index.js'];
var createWorker = function(appPath){
    //保存fork返回的进程实例
    var worker = fork(appPath);
    //监听子进程exit事件
    worker.on('exit',function(){
        pingPongLogger.error('worker:' + worker.pid + 'exited');
        delete workers[worker.pid];
        createWorker(appPath);
    });
    workers[worker.pid] = worker;
    pingPongLogger.info('Create worker:' + worker.pid);
};
//启动所有子进程
for (var i = appsPath.length - 1; i >= 0; i--) {
    createWorker(appsPath[i]);
}
//父进程退出时杀死所有子进程
process.on('exit',function(){
    pingPongLogger.info('parent process exit!')
    for(var pid in workers){
        workers[pid].kill();
    }
});
process.on('SIGINT', function(){
    pingPongLogger.info('parent process exit! SIGINT');
})
