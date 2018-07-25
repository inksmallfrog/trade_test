const boll = require('bollinger-bands');

module.exports = class{
    constructor(period, c){
        this.period = period;
        this.times = c;
        this.data = [];
        this.result = {
            upper: [],
            mid: [],
            lower: []
        }
    }
    get boolingerBands(){
        //if(this.data.length == this.period){
            return this.result;
        //}else{
          //  return null;
        //}
    }
    addData(data){
        if(data.close){
            if(this.data.length == this.period * 10){
                this.data.shift();
                this.data.push(data.close);
                this.calculateBoolingerBands();
            }else{
                this.data.push(data.close);
            }
        }else if(typeof +data == 'number'){
            if(this.data.length == this.period + 1){
                this.data.shift();
                this.data.push(+data);
                this.calculateBoolingerBands();
            }else{
                this.data.push(+data);
            }
        }
    }
    updateData(data){
        if(data.close){
            this.data[this.data.length - 1] = +data.close;
        }else if(typeof +data == 'number'){
            this.data[this.data.length - 1] = +data;
        }
    }
    calculateBoolingerBands(){
        this.result = boll(this.data, this.period, this.times);
    }
}