/**
 * Created by fay on 2018/9/13.
 */
const config = require('./game_config.json');
import qs from 'qs';
export default {

    // 请求接口  只有post，get 2种请求方式
    /**
     *
     * @param url  string
     * @param params bool|object
     * @returns {Promise.<*>}
     */
    async request(path,params = false) {

        let res = null;
        let url = config.api_base + path;

        if (!params){    // get 请求
            res = await axios({
                method: 'get',
                url: url
            });
        } else {
            res = await axios({
                method: 'post',
                header: {
                    'content-type': 'application/x-www-form-urlencoded'
                },
                url:url,
                data: qs.stringify(params)
            });
        }

        //console.log(res);

        return res;
    },

    // 保存玩家数据信息到后台



}







