function executionButtonClicked(){

    //情報の取得
    let startValue = document.getElementById("startValue").value;  //開始値
    let endValue = document.getElementById("endValue").value;  //終了値(増分値)
    let valueType = radioChecked(document.getElementsByName("valueType"));  //指定方法 end/add
    let changeAt = radioChecked(document.getElementsByName("changeAt"));  //変化箇所 note/maesure
    let changeType = radioChecked(document.getElementsByName("changeType"));  //変化タイプ diff/ratio/ease
    let easeType = document.getElementById('easeType').value;  //イージングの種類
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

                //イージング
                case "ease":
                    switch (easeType){
                        //Linear
                        case "linear":
                            value = (startValue + (endValue - startValue) * linear(nowSecond / totalSecond)) / nowBPM;
                            break;

                        //Sine
                        case "easeInSine":
                            value = (startValue + (endValue - startValue) * easeInSine(nowSecond / totalSecond)) / nowBPM;
                            break;
                        case "easeOutSine":
                            value = (startValue + (endValue - startValue) * easeOutSine(nowSecond / totalSecond)) / nowBPM;
                            break;
                        case "easeInOutSine":
                            value = (startValue + (endValue - startValue) * easeInOutSine(nowSecond / totalSecond)) / nowBPM;
                            break;
                        case "easeOutInSine":
                            value = (startValue + (endValue - startValue) * easeOutInSine(nowSecond / totalSecond)) / nowBPM;
                            break;

                        //Quad
                        case "easeInQuad":
                            value = (startValue + (endValue - startValue) * easeInQuad(nowSecond / totalSecond)) / nowBPM;
                            break;
                        case "easeOutQuad":
                            value = (startValue + (endValue - startValue) * easeOutQuad(nowSecond / totalSecond)) / nowBPM;
                            break;
                        case "easeInOutQuad":
                            value = (startValue + (endValue - startValue) * easeInOutQuad(nowSecond / totalSecond)) / nowBPM;
                            break;
                        case "easeOutInQuad":
                            value = (startValue + (endValue - startValue) * easeOutInQuad(nowSecond / totalSecond)) / nowBPM;
                            break;

                        //Cubic
                        case "easeInCubic":
                            value = (startValue + (endValue - startValue) * easeInCubic(nowSecond / totalSecond)) / nowBPM;
                            break;
                        case "easeOutCubic":
                            value = (startValue + (endValue - startValue) * easeOutCubic(nowSecond / totalSecond)) / nowBPM;
                            break;
                        case "easeInOutCubic":
                            value = (startValue + (endValue - startValue) * easeInOutCubic(nowSecond / totalSecond)) / nowBPM;
                            break;
                        case "easeOutInCubic":
                            value = (startValue + (endValue - startValue) * easeOutInCubic(nowSecond / totalSecond)) / nowBPM;
                            break;

                        //Quart
                        case "easeInQuart":
                            value = (startValue + (endValue - startValue) * easeInQuart(nowSecond / totalSecond)) / nowBPM;
                            break;
                        case "easeOutQuart":
                            value = (startValue + (endValue - startValue) * easeOutQuart(nowSecond / totalSecond)) / nowBPM;
                            break;
                        case "easeInOutQuart":
                            value = (startValue + (endValue - startValue) * easeInOutQuart(nowSecond / totalSecond)) / nowBPM;
                            break;
                        case "easeOutInQuart":
                            value = (startValue + (endValue - startValue) * easeOutInQuart(nowSecond / totalSecond)) / nowBPM;
                            break;

                        //Quint
                        case "easeInQuint":
                            value = (startValue + (endValue - startValue) * easeInQuint(nowSecond / totalSecond)) / nowBPM;
                            break;
                        case "easeOutQuint":
                            value = (startValue + (endValue - startValue) * easeOutQuint(nowSecond / totalSecond)) / nowBPM;
                            break;
                        case "easeInOutQuint":
                            value = (startValue + (endValue - startValue) * easeInOutQuint(nowSecond / totalSecond)) / nowBPM;
                            break;
                        case "easeOutInQuint":
                            value = (startValue + (endValue - startValue) * easeOutInQuint(nowSecond / totalSecond)) / nowBPM;
                            break;

                        //Expo
                        case "easeInExpo":
                            value = (startValue + (endValue - startValue) * easeInExpo(nowSecond / totalSecond)) / nowBPM;
                            break;
                        case "easeOutExpo":
                            value = (startValue + (endValue - startValue) * easeOutExpo(nowSecond / totalSecond)) / nowBPM;
                            break;
                        case "easeInOutExpo":
                            value = (startValue + (endValue - startValue) * easeInOutExpo(nowSecond / totalSecond)) / nowBPM;
                            break;
                        case "easeOutInExpo":
                            value = (startValue + (endValue - startValue) * easeOutInExpo(nowSecond / totalSecond)) / nowBPM;
                            break;

                        //Circ
                        case "easeInCirc":
                            value = (startValue + (endValue - startValue) * easeInCirc(nowSecond / totalSecond)) / nowBPM;
                            break;
                        case "easeOutCirc":
                            value = (startValue + (endValue - startValue) * easeOutCirc(nowSecond / totalSecond)) / nowBPM;
                            break;
                        case "easeInOutCirc":
                            value = (startValue + (endValue - startValue) * easeInOutCirc(nowSecond / totalSecond)) / nowBPM;
                            break;
                        case "easeOutInCirc":
                            value = (startValue + (endValue - startValue) * easeOutInCirc(nowSecond / totalSecond)) / nowBPM;
                            break;

                        //Back
                        case "easeInBack":
                            value = (startValue + (endValue - startValue) * easeInBack(nowSecond / totalSecond)) / nowBPM;
                            break;
                        case "easeOutBack":
                            value = (startValue + (endValue - startValue) * easeOutBack(nowSecond / totalSecond)) / nowBPM;
                            break;
                        case "easeInOutBack":
                            value = (startValue + (endValue - startValue) * easeInOutBack(nowSecond / totalSecond)) / nowBPM;
                            break;
                        case "easeOutInBack":
                            value = (startValue + (endValue - startValue) * easeOutInBack(nowSecond / totalSecond)) / nowBPM;
                            break;

                        //Elastic
                        case "easeInElastic":
                            value = (startValue + (endValue - startValue) * easeInElastic(nowSecond / totalSecond)) / nowBPM;
                            break;
                        case "easeOutElastic":
                            value = (startValue + (endValue - startValue) * easeOutElastic(nowSecond / totalSecond)) / nowBPM;
                            break;
                        case "easeInOutElastic":
                            value = (startValue + (endValue - startValue) * easeInOutElastic(nowSecond / totalSecond)) / nowBPM;
                            break;
                        case "easeOutInElastic":
                            value = (startValue + (endValue - startValue) * easeOutInElastic(nowSecond / totalSecond)) / nowBPM;
                            break;

                        //Bounce
                        case "easeInBounce":
                            value = (startValue + (endValue - startValue) * easeInBounce(nowSecond / totalSecond)) / nowBPM;
                            break;
                        case "easeOutBounce":
                            value = (startValue + (endValue - startValue) * easeOutBounce(nowSecond / totalSecond)) / nowBPM;
                            break;
                        case "easeInOutBounce":
                            value = (startValue + (endValue - startValue) * easeInOutBounce(nowSecond / totalSecond)) / nowBPM;
                            break;
                        case "easeOutInBounce":
                            value = (startValue + (endValue - startValue) * easeOutInBounce(nowSecond / totalSecond)) / nowBPM;
                            break;

                        //一致なし
                        default:
                            value = 0;
                            break;
                    }
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

            ////イージング

            //Linear
            function linear(x)
            {
                return x;
            }

            //Sine
            function easeInSine(x)
            {
                return 1 - Math.cos((x * Math.PI) / 2);
            }
            function easeOutSine(x)
            {
                return Math.sin((x * Math.PI) / 2);
            }
            function easeInOutSine(x)
            {
                return (x < 0.5) ? (easeInSine(x * 2) / 2) : (easeOutSine((x - 0.5) * 2) / 2 + 0.5);
            }
            function easeOutInSine(x)
            {
                return (x < 0.5) ? (easeOutSine(x * 2) / 2) : (easeInSine((x - 0.5) * 2) / 2 + 0.5);
            }

            //Quad
            function easeInQuad(x)
            {
                return Math.pow(x, 2);
            }
            function easeOutQuad(x)
            {
                return 1 - Math.pow(1 - x, 2);
            }
            function easeInOutQuad(x)
            {
                return (x < 0.5) ? (easeInQuad(x * 2) / 2) : (easeOutQuad((x - 0.5) * 2) / 2 + 0.5);
            }
            function easeOutInQuad(x)
            {
                return (x < 0.5) ? (easeOutQuad(x * 2) / 2) : (easeInQuad((x - 0.5) * 2) / 2 + 0.5);
            }

            //Cubic
            function easeInCubic(x)
            {
                return Math.pow(x, 3);
            }
            function easeOutCubic(x)
            {
                return 1 - Math.pow(1 - x, 3);
            }
            function easeInOutCubic(x)
            {
                return (x < 0.5) ? (easeInCubic(x * 2) / 2) : (easeOutCubic((x - 0.5) * 2) / 2 + 0.5);
            }
            function easeOutInCubic(x)
            {
                return (x < 0.5) ? (easeOutCubic(x * 2) / 2) : (easeInCubic((x - 0.5) * 2) / 2 + 0.5);
            }

            //Quart
            function easeInQuart(x)
            {
                return Math.pow(x, 4);
            }
            function easeOutQuart(x)
            {
                return 1 - Math.pow(1 - x, 4);
            }
            function easeInOutQuart(x)
            {
                return (x < 0.5) ? (easeInQuart(x * 2) / 2) : (easeOutQuart((x - 0.5) * 2) / 2 + 0.5);
            }
            function easeOutInQuart(x)
            {
                return (x < 0.5) ? (easeOutQuart(x * 2) / 2) : (easeInQuart((x - 0.5) * 2) / 2 + 0.5);
            }

            //Quint
            function easeInQuint(x)
            {
                return Math.pow(x, 5);
            }
            function easeOutQuint(x)
            {
                return 1 - Math.pow(1 - x, 5);
            }
            function easeInOutQuint(x)
            {
                return (x < 0.5) ? (easeInQuint(x * 2) / 2) : (easeOutQuint((x - 0.5) * 2) / 2 + 0.5);
            }
            function easeOutInQuint(x)
            {
                return (x < 0.5) ? (easeOutQuint(x * 2) / 2) : (easeInQuint((x - 0.5) * 2) / 2 + 0.5);
            }

            //Expo
            function easeInExpo(x)
            {
                return x == 0 ? 0 : Math.pow(2, 10 * x - 10);
            }
            function easeOutExpo(x)
            {
                return x == 1 ? 1 : 1 - Math.pow(2, -10 * x);
            }
            function easeInOutExpo(x)
            {
                return (x < 0.5) ? (easeInExpo(x * 2) / 2) : (easeOutExpo((x - 0.5) * 2) / 2 + 0.5);
            }
            function easeOutInExpo(x)
            {
                return (x < 0.5) ? (easeOutExpo(x * 2) / 2) : (easeInExpo((x - 0.5) * 2) / 2 + 0.5);
            }

            //Circ
            function easeInCirc(x)
            {
                return 1 - Math.sqrt(1 - Math.pow(x, 2));
            }
            function easeOutCirc(x)
            {
                return Math.sqrt(1 - Math.pow(x - 1, 2));
            }
            function easeInOutCirc(x)
            {
                return (x < 0.5) ? (easeInCirc(x * 2) / 2) : (easeOutCirc((x - 0.5) * 2) / 2 + 0.5);
            }
            function easeOutInCirc(x)
            {
                return (x < 0.5) ? (easeOutCirc(x * 2) / 2) : (easeInCirc((x - 0.5) * 2) / 2 + 0.5);
            }

            //Back
            function easeInBack(x)
            {
                const c1 = 1.70158;
                const c3 = c1 + 1;

                return c3 * Math.pow(x, 3) - c1 * Math.pow(x, 2);
            }
            function easeOutBack(x)
            {
                const c1 = 1.70158;
                const c3 = c1 + 1;

                return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
            }
            function easeInOutBack(x)
            {
                return (x < 0.5) ? (easeInBack(x * 2) / 2) : (easeOutBack((x - 0.5) * 2) / 2 + 0.5);
            }
            function easeOutInBack(x)
            {
                return (x < 0.5) ? (easeOutBack(x * 2) / 2) : (easeInBack((x - 0.5) * 2) / 2 + 0.5);
            }

            //Elastic
            function easeInElastic(x)
            {
                const c4 = (2 * Math.PI) / 3;

                return x == 0
                  ? 0
                  : x == 1
                  ? 1
                  : -Math.pow(2, 10 * x - 10) * Math.sin((x * 10 - 10.75) * c4);
            }
            function easeOutElastic(x)
            {
                const c4 = (2 * Math.PI) / 3;

                return x == 0
                  ? 0
                  : x == 1
                  ? 1
                  : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
            }
            function easeInOutElastic(x)
            {
                return (x < 0.5) ? (easeInElastic(x * 2) / 2) : (easeOutElastic((x - 0.5) * 2) / 2 + 0.5);
            }
            function easeOutInElastic(x)
            {
                return (x < 0.5) ? (easeOutElastic(x * 2) / 2) : (easeInElastic((x - 0.5) * 2) / 2 + 0.5);
            }

            //Bounce
            function easeInBounce(x)
            {
                return 1 - easeOutBounce(1 - x);
            }
            function easeOutBounce(x)
            {
                const n1 = 7.5625;
                const d1 = 2.75;

                if (x < 1 / d1)
                {
                    return n1 * x * x;
                }
                else if (x < 2 / d1)
                {
                    return n1 * (x -= 1.5 / d1) * x + 0.75;
                }
                else if (x < 2.5 / d1)
                {
                    return n1 * (x -= 2.25 / d1) * x + 0.9375;
                }
                else
                {
                    return n1 * (x -= 2.625 / d1) * x + 0.984375;
                }
            }
            function easeInOutBounce(x)
            {
                return (x < 0.5) ? (easeInBounce(x * 2) / 2) : (easeOutBounce((x - 0.5) * 2) / 2 + 0.5);
            }
            function easeOutInBounce(x)
            {
                return (x < 0.5) ? (easeOutBounce(x * 2) / 2) : (easeInBounce((x - 0.5) * 2) / 2 + 0.5);
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

//変化タイプが変更されたときの関数
function changeTypeChanged(){
    let calcType = radioChecked(document.getElementsByName("calcType"));
    let changeType = radioChecked(document.getElementsByName("changeType"));

    //イージングかつ音符基準の場合は、とりあえず等比に変える
    if(changeType == "ease" && calcType == "note"){
        document.getElementsByName("changeType").item(1).checked = true;
        alert("イージングは、秒数基準の計算方式にしか対応していません。");
    }
}

//計算方式が変更されたときの関数
function calcTypeChanged(){
    let calcType = radioChecked(document.getElementsByName("calcType"));
    let valueType = radioChecked(document.getElementsByName("valueType"));
    let changeType = radioChecked(document.getElementsByName("changeType"));

    //増分値かつ秒数基準の場合は、終了値に変える
    if(valueType == "add" && calcType == "second"){
        document.getElementsByName("valueType").item(0).checked = true;
        alert("計算方式が秒数基準の場合は、値の指定方法を増分値指定にすることは出来ません。");
        valueTypeChanged();
    }

    //イージングかつ音符基準の場合は、とりあえず等比に変える
    if(changeType == "ease" && calcType == "note"){
        document.getElementsByName("changeType").item(1).checked = true;
        alert("イージングは、秒数基準の計算方式にしか対応していません。");
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