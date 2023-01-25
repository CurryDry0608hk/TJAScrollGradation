function executionButtonClicked(){

    //情報の取得
    let startValue = document.getElementById("startValue").value;  //開始値
    let endValue = document.getElementById("endValue").value;  //終了値(増分値)
    let valueType = radioChecked(document.getElementsByName("valueType"));  //指定方法 end/add
    let changeAt = radioChecked(document.getElementsByName("changeAt"));  //変化箇所 note/maesure
    let changeType = radioChecked(document.getElementsByName("changeType"));  //変化タイプ diff/ratio
    let calcType = radioChecked(document.getElementsByName("calcType"));  //計算方式 note/second
    let decimalPlace = document.getElementById("decimalPlace").value;  //小数点以下の桁数
    let scrollOpti = document.getElementById("optimization").checked;  //最適化 true/false
    let tjaData = document.getElementById("tjaData").value.replace(/\r\n|\r/g, "\n");  //譜面データ(改行コード正規化)
    let resultArea = document.getElementById("resultArea");  //結果表示場所
    //取得確認
    //resultArea.value = startValue + "\n" + endValue + "\n" + valueType + "\n" + changeAt + "\n" + changeType + "\n" + scrollOpti + "\n" + tjaData;

    //譜面データを配列に分割
    let tjaArray = tjaDivide(tjaData);
    //分割確認
    /*for(let val of tjaArray){
        resultArea.value += val + "／";
    }
    return;*/

    //譜面データにスクグラを適用
    if(calcType == "note"){
        calcScrollGradTypeNote(tjaArray);
    }else if(calcType == "second"){
        calcScrollGradTypeSecond(tjaArray);
    }

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
        //配列の要素分ループ
        for(let i = 0; i < tmpArray.length; i++){
            //配列の要素を変数に保存
            let tmpStr = tmpArray[i];

            //音符単位もしくは秒数基準の場合
            if(changeAt == "note" || calcType == "second"){

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








    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    //譜面データにスクグラを適用する関数(譜面データ(配列)) 音符基準版
    function calcScrollGradTypeNote(tjaArray){

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











    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    //譜面データにスクグラを適用する関数(譜面データ(配列)) 秒数基準版
    function calcScrollGradTypeSecond(tjaArray){

        //変数等準備
        let startBPM = 240;
        let endBPM = 240;
        let nowBPM = 0;
        let nowMeasure = 1;
        let totalSecond = 0;
        let nowNotes = 0;


        ////最初のBPMを決定

        //譜面内にBPMCHANGEがあるか検索
        let isBpmchange = false;
        let firstBpmchangeIndex = 0;
        for(let i = 0; i < tjaArray.length; i++){
            if((new RegExp(/^#BPMCHANGE -?\d+(?:\.\d+)?/)).test(tjaArray[i])){
                isBpmchange = true;
                firstBpmchangeIndex = i;
                break;
            }
        }

        //BPMCHANGEがあるなら
        if(isBpmchange){
            //最初の音符を検索
            let firstNoteIndex = 0;
            for(let i = 0; i < tjaArray.length; i++){
                if((new RegExp(/^\d+/)).test(tjaArray[i]) || (new RegExp(/^\d*,/)).test(tjaArray[i])){
                    firstNoteIndex = i;
                    break;
                }
            }
            //最初の音符よりも最初のBPMCHANGEの方が前なら
            if(firstBpmchangeIndex < firstNoteIndex){
                //最初のBPMCHANGEの値を最初のBPMにする
                startBPM = (new RegExp(/^#BPMCHANGE (-?\d+(?:\.\d+)?)/)).exec(tjaArray[firstBpmchangeIndex])[1];
            //そうでないなら
            }else{
                //最初のBPMの入力を求める
                startBPM = prompt("譜面データの最初のBPM値を入力してください。");
                if(isNaN(startBPM)){
                    alert("入力が数値ではありません。");
                    return;
                }
            }

            //最後のBPMを検索
            let lastBpmchangeIndex = 0;
            for(let i = tjaArray.length - 1; i >= 0; i--){
                if((new RegExp(/^#BPMCHANGE -?\d+(?:\.\d+)?/)).test(tjaArray[i])){
                    lastBpmchangeIndex = i;
                    break;
                }
            }
            //最後のBPMCHANGEの値を最後のBPMにする
            endBPM = (new RegExp(/^#BPMCHANGE (-?\d+(?:\.\d+)?)/)).exec(tjaArray[lastBpmchangeIndex])[1];
        }

        //開始値と終了値を見た目BPMに変換
        startValue *= startBPM;
        endValue *= endBPM;



        ////全体の秒数を計算する
        let detailArray = new Array(tjaArray.length);
        nowBPM = startBPM;
        
        //配列の要素分ループ
        for(let i = 0; i < tjaArray.length; i++){
            //配列の要素を変数に保存
            let tmpStr = tjaArray[i];

            //#BPMCHANGEの場合
            if((new RegExp(/^#BPMCHANGE -?\d+(?:\.\d+)?/)).test(tmpStr)){
                //現在のBPMを変更
                nowBPM = (new RegExp(/^#BPMCHANGE (-?\d+(?:\.\d+)?)/)).exec(tmpStr)[1];
            }

            //#MEASUREの場合
            if((new RegExp(/^#MEASURE -?\d+(?:\.\d+)?\/\d+(?:\.\d+)?/)).test(tmpStr)){
                //現在のMEASUREを変更
                let match = (new RegExp(/^#MEASURE (-?\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)/)).exec(tmpStr);
                nowMeasure = match[1] / match[2];
            }

            //音符のみの場合(コンマなし)
            if((new RegExp(/^\d+/)).test(tmpStr) && !(new RegExp(/^\d*,/)).test(tmpStr)){
                //小節の頭かどうか
                let isMeasureHead = (nowNotes == 0);

                //音符があるかどうか
                let hasNotes = (new RegExp(/^[1-9]/)).test(tmpStr);

                //情報を保存
                detailArray[i] = {nowSecond:totalSecond, nowBPM:nowBPM, isMeasureHead:isMeasureHead, hasNotes:hasNotes};

                //小節の頭なら
                if(isMeasureHead){
                    //一番近いコンマを検索
                    let nextComma = tjaArray.length;
                    for(let j = i; j < tjaArray.length; j++){
                        if((new RegExp(/^\d*,/)).test(tjaArray[j])){
                            nextComma = j;
                            break;
                        }
                    }
                    //総音符数を数える
                    for(let j = i; j <= nextComma; j++){
                        if((new RegExp(/^\d+/)).test(tjaArray[j])){
                            nowNotes += (new RegExp(/^\d+/)).exec(tjaArray[j])[0].length;
                        }
                    }
                }

                //秒数を計算して加算
                totalSecond += (240.0 / nowBPM) * nowMeasure * (1.0 / nowNotes);
            }

            //コンマありの場合
            if((new RegExp(/^\d*,/)).test(tmpStr)){
                //小節の頭かどうか
                let isMeasureHead = (nowNotes == 0);

                //音符があるかどうか
                let hasNotes = (new RegExp(/^[1-9]/)).test(tmpStr);

                //情報を保存
                detailArray[i] = {nowSecond:totalSecond, nowBPM:nowBPM, isMeasureHead:isMeasureHead, hasNotes:hasNotes};

                //小節の頭ならnowNotesを1にする
                if(isMeasureHead) nowNotes = 1;

                //秒数を計算して加算
                totalSecond += (240.0 / nowBPM) * nowMeasure * (1.0 / nowNotes);

                //nowNotesをリセット
                nowNotes = 0;
            }
        }



        ////SCROLL値を計算して出力する

        //配列の要素分ループ
        for(let i = 0; i < tjaArray.length; i++){
            //変数に格納
            let detail = detailArray[i];

            //要素に値が入っていたら
            if(detail != undefined){
                //小節の頭、もしくは音符ごとかつノーツを持っている、もしくは音符ごとかつ最適化をしない
                if((detail.isMeasureHead) || (changeAt == "note" && detail.hasNotes) || (changeAt == "note" && !scrollOpti)){
                    //前の要素の末尾が改行でなく、かつiが0より大きいなら改行する
                    let newLine = "";
                    if(i > 0 && !(new RegExp(/\n$/)).test(tjaArray[i-1])){
                        newLine = "\n";
                    }
                    //#SCROLL値を計算して追記
                    tjaArray[i] = newLine + scroll(detail.nowSecond, detail.nowBPM) + "\n" + tjaArray[i];
                }
            }
        }

        //最後に#SCROLLを追加
        tjaArray.push("\n" + scroll(totalSecond, nowBPM));






        //#SCROLL値を計算するメソッド
        function scroll(nowSecond, nowBPM){

            //#SCROLL値を格納する変数
            let value = 0;

            switch(changeType){
                //等差
                case "diff":
                    value = diff(startValue, endValue, nowSecond / totalSecond) / nowBPM;
                    break;

                //等比
                case "ratio":
                    value = ratio(startValue, endValue, nowSecond / totalSecond) / nowBPM;
                    break;
            }

            //#SCROLLを返す
            return "#SCROLL " + Math.round(value * Math.pow(10, decimalPlace)) / Math.pow(10, decimalPlace);

            //等差
            function diff(start, end, now){
                return start + (end - start) * now;
            }

            //等比
            function ratio(start, end, now){
                return start * Math.pow(end / start, now);
            }
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
    let calcType = radioChecked(document.getElementsByName("calcType"));

    //テキストを変える
    if(valueType == "end"){
        valueTypeText.innerText = "終了値";
    }else if(valueType == "add"){
        valueTypeText.innerText = "増分値";
    }

    //増分値かつ秒数基準の場合は、終了値に変える
    if(valueType == "add" && calcType == "second"){
        document.getElementsByName("valueType").item(0).checked = true;
        alert("計算方式が秒数基準の場合は、値の指定方法を増分値指定にすることは出来ません。");
        valueTypeChanged();
    }
}

//計算方式が変更されたときの関数
function calcTypeChanged(){
    let calcType = radioChecked(document.getElementsByName("calcType"));
    let valueType = radioChecked(document.getElementsByName("valueType"));

    //増分値かつ秒数基準の場合は、終了値に変える
    if(valueType == "add" && calcType == "second"){
        document.getElementsByName("valueType").item(0).checked = true;
        alert("計算方式が秒数基準の場合は、値の指定方法を増分値指定にすることは出来ません。");
        valueTypeChanged();
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
