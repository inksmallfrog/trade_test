#!/bin/bash
strategy_log=`tail -n 20 /service/trade_test/log/strategy.log`
trade_log=`tail -n 20 /service/trade_test/log/trade.log`
pingpong_log=`tail -n 1 /service/trade_test/log/pingpong.log`
error_log=`tail -n 30 /service/trade_test/log/error.log`
unwatched_log=`tail -n 30 ~/.pm2/logs/index-error.log`

echo "===strategy.log==="
if [ -n "$strategy_log" ]
then
    echo "$strategy_log"
else
    echo "no log."
fi

echo "===trade.log==="
if [ -n "$trade_log" ]
then
    echo "$trade_log"
else
    echo "no log."
fi

echo "===pingpong.log==="
if [ -n "$pingpong_log" ]
then
    echo "$pingpong_log"
else
    echo "no log."
fi

echo "===error.log==="
if [ -n "$error_log" ]
then 
    echo "$error_log"
else
    echo "no log."
fi

echo "===unwatched.log==="
if [ -n "$unwatched_log" ]
then
    echo "$unwatched_log"
else
    echo "no log."
fi
