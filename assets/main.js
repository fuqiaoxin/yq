/**
 * Created by fay on 2018/9/13.
 */

window.axios = require('axios');
window.swal = require('sweetalert2');
import action from './action.js';

const game_config = require('./game_config.json');
const lang = require('./lang/en.json');


let JCmain = {

    setState: function (store,value) {
        value = JSON.stringify(value);
        localStorage.setItem(store,value);
    },
    getState: function (store) {
        let res = localStorage.getItem(store);
        return JSON.parse(res);
    },


    user: function () {
        let user = this.getState('user');
        return user;
    },

    setParams: function (params) {
        let server = this.getState('server');

        if (server) {
            let sid = server.sid;
            params['sid'] = sid;
        }

        let user = this.getState('user');
        if (user) {
            params['uid'] = user.uid;
            params['token'] = user.token;
        }

        params['gid'] = game_config.gid;
        params['platform_name'] = game_config.platform_name;

        return params;

    },

    async request(path, params){
        params = this.setParams(params)
        let res = await action.request(path, params);
        return res;
    },

    async login(params) {
        if (params) {

            let path = '/instantlogin';
            let res = await this.request(path, params);

            let data = res.data;
            if (data.errCode == 0) {
                let user = {
                    uid: data.data.uid,
                    token: data.data.token,
                    avatar: params.avatar,
                    platform_uid: params.platform_uid,
                    name: params.name
                };

                this.setState('user', user);

            } else {
                // 登录出错
                swal(lang.login_error, '', 'error');
            }

        }
    },
    
    logout: function () {
        localStorage.removeItem('user');
        localStorage.removeItem('server');
    },

    async setServer(sid) {
        let server = {
            sid: sid
        };
        this.setState('server', server);

        let params = server;

        // 通知服务器
        let path = '/setserver';
        let res = await this.request(path, params);

        let data = res.data;
        if (data.errCode != 0) {
            swal(data.msg, '', 'error');
            return false;
        }

        return true;
    },

    async reportLevel(level) {
        let params = {
            level: level
        };
        let path = '/reportLevel';
        let res = await this.request(path, params);

        let data = res.data;
        if (data.errCode != 0) {
            swal(data.msg, '', 'error');
            return false;
        }

        this.setRank();

        return true;

    },

    // 显示排行榜
    fbRank() {

        FBInstant.getLeaderboardAsync(game_config.rank_name)
            .then(function(leaderboard){
                return leaderboard.getEntriesAsync();
            })
            .then(function(entries){
                this.populateLeaderboard(entries);
            })
            .catch(function(error) {
                console.log('Leaderboard "'+ game_config.rank_name +'" not found in app configuration')
            });
    },

    setRank(pointScore) {
        let scoreLeaderBoard;
        FBInstant.getLeaderboardAsync(game_config.rank_name)
            .then(function(leaderboard){
                scoreLeaderBoard = leaderboard;
                return leaderboard.setScoreAsync(pointScore);
            })
            .then(function(entry){
                return scoreLeaderBoard.getEntriesAsync();
            })
            .then(function(entries){
                this.populateLeaderboard(entries);
                this.updateContext();
            })
            .catch(function(error){
                console.log('Error updating score leaderboard: '+ error.message);
            });
    },

    populateLeaderboard(entries) {

        entries.forEach(function(entry) {

            // li.append($('<img class="lb-photo" src="'+entry.getPlayer().getPhoto()+'"/>'));
            // li.append($('<span class="lb-rank">#'+entry.getRank()+'</span>'));
            // li.append($('<span class="lb-score">('+entry.getFormattedScore()+')</span>'));
        });
    },
    // 更新排行榜
    updateContext() {
        //var contextId = FBInstant.context.getID();
        FBInstant.updateAsync({
            action: 'LEADERBOARD',
            name: game_config.rank_name,
            text: 'My custom update text'
        })
            .then(function(){
                //FBInstant.quit();
            });

    },

    share() {
        FBInstant.shareAsync({
            intent: 'SHARE',
            image: game_config.share_image,
            text: game_config.share_message,
            data: { method: 'share', uid: this.user().uid },
        }).then(function () {
            //
        });
    },

    invite() {
        FBInstant.shareAsync({
            intent: 'INVITE',
            image: game_config.share_image,
            text: game_config.share_message,
            data: { method: 'invite', uid: this.user().uid },
        }).then(function () {
            //
        });
    },

    chooseAsync() {
        FBInstant.context.chooseAsync();
    },

    payment() {

        let supportedAPIs = FBInstant.getSupportedAPIs();
        if (supportedAPIs.includes('payments.purchaseAsync')) {
            swal('payments includes ...', '', 'success');

            FBInstant.payments.onReady(function () {
                console.log('Payments Ready!');
                swal('Payments Ready!', '', 'success');

                // FBInstant.payments.purchaseAsync({
                //     productID: '10001',
                //     developerPayload: 'foobar',
                // }).then(function (purchase) {
                //     console.log(purchase);
                //     swal(purchase, '', 'success');
                //     // {productID: '12345', purchaseToken: '54321', developerPayload: 'foobar', ...}
                // });
            });


        } else {
            swal('payments not supported...', '', 'error');
        }



    }




}

window.JCmain = JCmain;


const FILE_LIST = require('./files.json');
window.onload = function() {

    FBInstant.initializeAsync().then(function() {

        FILE_LIST.fileList.forEach(function(imgName, index){
            FBInstant.setLoadingProgress(Math.ceil(index / FILE_LIST.fileList.length)*100);
        });


        // Finished loading. Start the game
        FBInstant.startGameAsync().then(function() {
            // let contextId = FBInstant.context.getID();
            // let contextType = FBInstant.context.getType();

            let playerName = FBInstant.player.getName();
            let playerPic = FBInstant.player.getPhoto();
            let playerId = FBInstant.player.getID();

            let fb_user = {
                name: playerName,
                avatar: playerPic,
                platform_uid: playerId
            };


            FBInstant.player.getSignedPlayerInfoAsync()
                .then(function (result) {
                    //console.log(result);
                    let signature = result.getSignature();

                    fb_user['sign'] = signature;
                    JCmain.login(fb_user);
                });

            let res = FBInstant.getEntryPointData();
            if (res) {
                console.log(res);
                swal(JSON.stringify(res), '', 'success');
            }

            //FBInstant.Leaderboard.getConnectedPlayerEntriesAsync();
        });
    });

}

window.onunload = function () {
    JCmain.logout();
}







