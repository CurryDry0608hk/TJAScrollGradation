function executionButtonClicked(){

    //情報の取得
    let startValue = document.getElementById("startValue").value;  //開始値
    let endValue = document.getElementById("endValue").value;  //終了値(増分値)
    let valueType = radioChecked(document.getElementsByName("valueType"));  //指定方法 end/add
    let changeAt = radioChecked(document.getElementsByName("changeAt"));  //変化箇所 note/maesure
    let changeType = radioChecked(document.getElementsByName("changeType"));  //変化タイプ diff/ratio
    let decimalPlace = document.getElementById("decimalPlace").value;  //小数点以下の桁数
    let scrollOpti = document.getElementById("optimization").checked;  //最適化 true/false
    let tjaData = document.getElementById("tjaData").value.replace(/\r\n|\r/g, "\n");  //譜面データ(改行コード正規化)
    let resultArea = document.getElementById("resultArea");  //結果表示場所
    //取得確認
    //resultArea.value = startValue + "\n" + endValue + "\n" + valueType + "\n" + changeAt + "\n" + changeType + "\n" + scrollOpti + "\n" + tjaData;

    //譜面データを配列に分割
    let tjaArray = tjaDivide(tjaData);
    //分割確認
    //for(let val of tjaArray){
    //    resultArea.value += val + "／";
    //}

    //譜面データにスクグラを適用
    calcScrollGrad(tjaArray);

    //結果を出力
    let outputStr = "";
    for(let val of tjaArray){
        outputStr += val;
    }
    resultArea.value = outputStr;






    //譜面データを配列に分割する関数(譜面データ(文字列))
    function tjaDivide(str){
        //戻り値として返すための配列
        let returnArray = [];

        //受け取った文字列を改行で分割してtmpArrayに入れる
        let tmpArray = str.split("\n");
        //配列の最後の要素以外の末尾に改行を追加
        for(let i = 0; i < tmpArray.length; i++){
            if (i + 1 < tmpArray.length) {
                tmpArray[i] += "\n";
            }
        }

        //音符単位であれば音符ごとに分割して、受け取った配列に入れる
        for(let i = 0; i < tmpArray.length; i++){
            //配列の要素を変数に保存
            let tmpStr = tmpArray[i];

            //音符単位なら
            if(changeAt == "note"){

                //この行に音符が含まれている場合
                if((new RegExp(/^[0-9]+/)).test(tmpStr)){
                    //文字数分ループ
                    for(let j = 0; j < tmpStr.length; j++){
                        //j文字目が数字(音符)なら一文字ずつ配列に追加
                        if(!isNaN(tmpStr.charAt(j))){
                            returnArray.push(tmpStr.charAt(j));
                        //数字(音符)でないなら
                        }else{
                            //その位置から最後までを、1つ前の配列の要素の後ろにつなげる
                            returnArray[returnArray.length - 1] += tmpStr.substr(j);
                            break;
                        }
                    }

                //そうでない場合(音符がない場合)
                }else{
                    //配列に追加
                    returnArray.push(tmpStr);
                }
                
            //小節単位なら
            }else if(changeAt == "measure"){
                //配列に追加
                returnArray.push(tmpStr);
            }
        }

        //配列を返す
        return returnArray;
    }






    //譜面データにスクグラを適用する関数(譜面データ(配列))
    function calcScrollGrad(tjaArray){

        //変化回数を予め計算
        let changeCount = 0;
        //音符単位の場合
        if(changeAt == "note"){
            for(let val of tjaArray){
                if((new RegExp(/^[0-9]+|^[0-9]*,/)).test(val)){
                    changeCount++;
                }
            }
        //小節単位の場合
        }else if(changeAt == "measure"){
            for(let val of tjaArray){
                if((new RegExp(/^[0-9]*,/)).test(val)){
                    changeCount++;
                }
            }
        }
        //変化回数確認
        //resultArea.value += changeCount + "／";



        //一回あたりの変化量を算出
        let changeValue = 0;

        //増分値指定の場合
        if(valueType == "add"){
            //増分値(終了値)を変化量に代入
            changeValue = endValue;

        //終了値指定の場合
        }else if(valueType == "end"){
            //等差の場合
            if(changeType == "diff"){
                changeValue = (endValue - startValue) / changeCount;
            //等比の場合
            }else if(changeType == "ratio"){
                changeValue = Math.pow((endValue / startValue), 1 / changeCount);
            }
        }

        //変化量確認
        //resultArea.value += changeValue + "／";



    


        ////#SCROLL値を計算して記入

        //現在の位置を記録する変数
        let nowCount = 0;

        //小節の先頭のフラグ
        let measureHeadFlag = false;

        //配列の要素分ループ
        for(let i = 0; i < tjaArray.length; i++){
            //配列の要素を変数に保存
            let tmpStr = tjaArray[i];

            //先頭が数字かコンマ以外だったら次のループへ
            if(!(new RegExp(/^[0-9]+|^[0-9]*,/)).test(tmpStr)){
                continue;
            }

            //一番最初の小節にたどり着いた時(先頭が数字かコンマかつnowCountが0)
            if((new RegExp(/^[0-9]+|^[0-9]*,/)).test(tmpStr) && nowCount == 0){
                //頭に開始値の#SCROLLを追加
                tjaArray[i] = scroll() + "\n" + tmpStr;
                //位置を更新
                nowCount++;
                //コンマが含まれていたらフラグを立てる
                if((new RegExp(/^[0-9]*,/)).test(tmpStr)){
                    measureHeadFlag = true;
                }
                //次のループへ
                continue;
            }

            //音符かコンマがある場合
            if((new RegExp(/^[0-9]+|^[0-9]*,/)).test(tmpStr)){
                //音符単位の場合
                if(changeAt == "note"){

                    //前の要素の末尾が改行でなければ改行する
                    let newLine = "";
                    if(!(new RegExp(/\n$/)).test(tjaArray[i-1])){
                        newLine = "\n";
                    }

                    //最適化がオフ、または先頭が0以外の数字、またはフラグが立っている時に#SCROLLを追加
                    if(!scrollOpti || (new RegExp(/^[1-9]/)).test(tmpStr) || measureHeadFlag){
                        tjaArray[i] = newLine + scroll() + "\n" + tmpStr;
                    }

                    //位置を更新
                    nowCount++;

                    //フラグを下ろす
                    measureHeadFlag = false;

                    //コンマが含まれていたらフラグを立てる
                    if((new RegExp(/^[0-9]*,/)).test(tmpStr)){
                        measureHeadFlag = true;
                    }

                    //次のループへ
                    continue;

                //小節単位の場合
                }else if(changeAt == "measure"){

                    //小節の先頭のフラグが立っていたら
                    if(measureHeadFlag){
                        //#SCROLLを追加
                        tjaArray[i] = scroll() + "\n" + tmpStr;
                        //位置を更新
                        nowCount++;
                        //フラグを下ろす
                        measureHeadFlag = false;
                    }

                    //コンマが含まれていたらフラグを立てる
                    if((new RegExp(/^[0-9]*,/)).test(tmpStr)){
                        measureHeadFlag = true;
                    }

                    //次のループへ
                    continue;
                }
            }
        }

        //音符単位時または、小節単位時かつフラグが立っている場合に#SCROLLを追加
        if(changeAt == "note" || (changeAt == "measure" && measureHeadFlag)){
            tjaArray.push("\n" + scroll());
        }






        //#SCROLLを計算して文字列を生成する関数
        function scroll(){
            //#SCROLL値を格納する変数
            let scroll = 0;

            //等差の場合
            if(changeType == "diff"){
                scroll = parseInt(startValue) + (changeValue * nowCount);
            //等比の場合
            }else if(changeType == "ratio"){
                scroll = startValue * Math.pow(changeValue, nowCount);
            }

            //生成結果を戻す
            return "#SCROLL " + Math.round(scroll * Math.pow(10, decimalPlace)) / Math.pow(10, decimalPlace);
        }
    }
}






//ラジオボタンの選択値を取得する関数(要素(ラジオボタン))
function radioChecked(elements){
    for(let i = 0; i < elements.length; i++){
        if (elements.item(i).checked){
            return elements.item(i).value;
        }
    }
}

//指定方法が変更されたときの関数
function valueTypeChanged(){
    let valueTypeText = document.getElementById("valueTypeText");
    let valueType = radioChecked(document.getElementsByName("valueType"));
    if(valueType == "end"){
        valueTypeText.innerText = "終了値";
    }else if(valueType == "add"){
        valueTypeText.innerText = "増分値";
    }
}

//クリップボードにコピー
function copyToClipboard(){
    if(!navigator.clipboard){
        alert("このブラウザでは対応していません。")
    }
    let button = document.getElementById("copyToClipboard");
    let resultArea = document.getElementById("resultArea");
    navigator.clipboard.writeText(resultArea.value).then(() => {
        button.innerText = "コピーしました！";
        setTimeout(() => {
            button.innerText = "クリップボードにコピー";
        }, 2000)
    });
}