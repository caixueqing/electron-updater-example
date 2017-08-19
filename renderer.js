// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const serialport = require('serialport');
const { ipcRenderer } = require('electron');
var request = require('request');
var parseString = require('xml2js').parseString;

//
/*serialport.list(function(err, ports){
  console.log('ports', ports);
  if (err) {
    document.getElementById('error').textContent = err.message
    return
  } else {
    document.getElementById('error').textContent = ''
  }

  if (ports.length === 0) {
    document.getElementById('error').textContent = 'No ports discovered'
  }

  const headers = Object.keys(ports[0])
  const table = createTable(headers)
  tableHTML = ''
  table.on('data', function(data) {tableHTML += data})
  table.on('end', function(){document.getElementById('ports').innerHTML = tableHTML})
  ports.forEach(function(port) {table.write(port)})
  table.end();
});*/

// Listen for mes
// sages
var updatingFlag = false;

ipcRenderer.on('message', function(event, text) {
    var container = $('#messages');
    container.append('<div>' + text + '</div>');
});

ipcRenderer.on('updateMessage', function(event, text) {
    if (!updatingFlag) {
        updatingFlag = true;
        //显示下载进度
        $('#updateSoftModal').modal({
            backdrop: false,
            keyboard: false
        });
    }
    var dataArr = text.split("-");
    var downBar = $('#downpbar');
    $('#downloadSpeed').text(dataArr[0]+'kb/s');
    downBar.attr('downpbar', dataArr[1]);
    var valPer = dataArr[1] + '%';
    downBar.width(valPer);
    downBar.text(valPer);
    $('#exeSize').text(dataArr[2]+'M');

})

ipcRenderer.on('showVersion', function(event, text) {
    // Display the current version
    $('#version').text(text);
})

$(function() {
    var port;
    //打开串口
    $('#open-serialport').on('click', function() {
        var portText = $('#serialport').val();
        port = new serialport(
            portText, {
                baudRate: 19200, //波特率
                dataBits: 8, //数据位
                parity: 'even', //奇偶校验
                stopBits: 1, //停止位
                autoOpen: false
            },
            function(err) {
                if (err) {
                    $('#serialport_status').html('Error: ', err.message);
                }
            }
        );
        port.open(function(err) {
            if (err) {
                $('#serialport_status').html('Error opening port: ', err.message);
            } else {
                $('#serialport_status').html('串口状态：' + portText + '成功打开');
            }

            // Because there's no callback to write, write errors will be emitted on the port:
            //port.write('main screen turn on');
        });

        port.on('data', onData);

        function onData(sdata) {
            var sNum = '';
            window.jQuery.each(sdata, function(index, ele) {
                sNum += ele.toString(16);
            });
            window.jQuery('#serialport-recdata').val(sNum);
            //原数据返回
            port.write(sdata)
        }
    });
    //关闭串口
    $('#close-serialport').on('click', function() {
        if (typeof(port) != "undefined") {
            port.close(function() {
                $('#serialport_status').html('串口状态：成功关闭串口');
            });
        }
    });

    //测试发送HTTP请求
    $('#send-http-request').on('click', function() {
        request.post({
                url: 'http://www.diandou8.com/solidMach/getMaterialsTypeList',
                form: { 'machineCode': '37132400711', 'macAddress': 'D8-CB-8A-6D-D5-CD', 'queryType': 'n' }
            },
            function(error, response, body) {
                if (!error && response.statusCode == 200) {
                    //$('#httpRecData').html(body);
                    parseString(body, { explicitArray: false }, function(err, result) {
                        var typelist = result.materialsTypes.materialsType;
                        var typeContent = '<ul>';
                        for (var i = typelist.length - 1; i >= 0; i--) {
                            typeContent += '<li>' + typelist[i].materialsName + '_' + typelist[i].materialsCode + '</li>'
                        }
                        typeContent += '</ul>';
                        $('#httpRecData').html(typeContent);
                    });
                }
            });
    });

    //检测软件更新
    $('#check_version_btn').on('click', function() {
        $('#updateSoftModal').modal({
            backdrop: false,
            keyboard: false
        });
    });
});