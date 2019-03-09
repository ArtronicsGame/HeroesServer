const DEBUG = module.exports = {};

var reportState = {

    Requests: {
        UDP: {
            Start: {
                Message: true
            },
            Connect: {
                IP: true,
                Port: false
            },
            Data: {
                IP: true,
                Port: true,
                Data: true
            },
            Send: {
                IP: false,
                Port: false,
                Data: false
            },
            Disconnect: {
                IP: false,
                Port: false
            }
        },
        TCP: {
            Start: {
                Message: true
            },
            Connect: {
                IP: true,
                Port: true
            },
            Data: {
                IP: true,
                Port: true,
                Type: true,
                Info: true
            },
            Send: {
                IP: false,
                Port: false,
                Type: false,
                Info: false
            },
            Disconnect: {
                IP: true,
                Port: true
            }
        },
        SharedTCP: {
            Forward: {
                Message: true
            }
        }
    },
    Match: {
        Create: {
            Members: false
        },
        Live: {
            Connect: {
                Id: false
            },
            Disconnect: {
                Id: false
            }
        }
    },
    Player: {
        New: {
            IP: false,
            Port: false,
            Values: ['username'],
            Filter: { username: 'Hojat' }
        },
        Get: {
            IP: false,
            Port: false,
            Status: false,
            Values: ['username']
        }
    },
    Clan: {
        New: {
            IP: true,
            Port: true,
            Values: ['clanName'],
        }
    },
    Error: {
        TCP: {
            IP: false,
            Port: false,
            Message: true
        },
        UDP: {
            Send: {
                IP: false,
                Port: false,
                Message: true
            }
        }
    }
};

DEBUG.d = function (message, ...group) {
    if (group == undefined) return;
    var data = reportState

    var nothing = true;
    var flag = true;

    var Result = "On ";
    for (let subgroup of group) {
        Result += `${subgroup} `;
        data = data[subgroup];
    }
    Result += ':\n{\n';

    var Filter = {};
    if (data.Filter != undefined)
        Filter = data.Filter;

    Object.keys(data).forEach(k => {
        if (k == "Values" || k == "Filter")
            return;
        else if (data[k]) {
            nothing = false;
            var msg = message[k];
            if (Filter[k] == undefined || Filter[k] == msg) {
                if (msg instanceof Object)
                    msg = JSON.stringify(msg).replace(/"/g, "").replace(/,/g, ",\n");
                else
                    msg = String(msg);
                let lines = msg.split('\n');
                Result += '   ' + `${k} : ${lines[0]} \n`;
                lines = lines.splice(1, lines.length - 1, 0);
                let spaces = '       ';
                for (let i = 0; i < k.length; i++)
                    spaces += ' ';
                for (let line of lines) {
                    Result += spaces + `${line} \n`;
                }

            }
            else {
                flag = false;
            }
        }
    });

    var parseArray = function (msg) {
        for (let key of data.Values) {
            var msg = message.value[key];
            if (Filter[key] == undefined || Filter[key] == msg) {
                let lines = msg.split('\n');
                Result += '   ' + `${key} : ${lines[0]} \n`;
                lines = lines.splice(1, lines.length - 1, 0);
                let spaces = '      ';
                for (let i = 0; i < key.length; i++)
                    spaces += ' ';
                for (let line of lines) {
                    Result += spaces + `${line} \n`;
                }
            } else {
                flag = false;
                break;
            }
        }
    };

    if (data.Values != undefined && flag)
        parseArray(message.value);

    if (flag && !nothing)
        console.log(Result + '}');
}