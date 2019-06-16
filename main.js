//nodejs module
var http = require('http');
var fs = require('fs');
var url = require('url');//url 모듈
var qs = require('querystring');

var template = {
  html:function(title, list, body, control){
    return `
    <!doctype html>
    <html>
      <head>
        <title>Yenny: ${title}</title>
        <meta charset="utf-8">
        <style>
          a{
            color:Tomato;
            text-decoration:none;
          }
          h1{
            border-bottom: 1px solid Tan;
            padding: 20px;
            margin:0;
            font-size: 50px;
            text-align: left;
          }
          #grid ul{
            border-left: 1px solid Tan;
            list-style-type:none;
            padding: 20px;
            margin:0;
            font-size: 25px;
            text-align: center;
          }
          #active{
            color:Tan;
            font-weight:bold;
          }
          #grid{
            display:grid;
            grid-template-columns: 1fr 150px;
          }
          #body{
            color:Tan;
            padding:20px;
          }
          #control{
            margin:20px;
            float:right;
          }
          @media(max-width:800px){
            #grid ul{
              border-left: none;
            }
            #grid{
              display:block;
            }
          }

        </style>
      </head>
      <body>
        <h1><a href="/"> < Heo Ye Eun /> </a></h1>
        <div id="grid">
          <div id="body">
            ${body}
          </div>
          ${list}
        </div>
        <div id="control">
          ${control}
        </div>
      </body>
    </html>
    `;
  },
  list:function(title, filelist){
    var list = '<ul>';
    var i = 0;
    while(i < filelist.length)
    {
      if(title === filelist[i])
        list += `<li><a href="/?id=${filelist[i]}" id="active">${filelist[i]}</a></li>`;
      else
        list += `<li><a href="/?id=${filelist[i]}">${filelist[i]}</a></li>`;
      i++;
    }
    list = list+'</ul>';
    return list;
  }
}

var app = http.createServer(function(request,response){

    var _url = request.url;
    var queryData = url.parse(_url, true).query;
    var pathname = url.parse(_url, true).pathname;
    var title = queryData.id

    if(pathname === '/'){
      if(title === undefined){//Home
        fs.readdir('./data', function(error, filelist){

          var title = 'Welcome';
          var description = 'Hello, This is yenny blog!';
          var list = template.list(title, filelist);
          var html = template.html(title, list,
            `<h2>${title}</h2>${description}`,
            `<a href="/create">create</a>`);
          response.writeHead(200);
          response.end(html);
        });
      }
      else {//목록 읽어오기
        fs.readFile(`data/${title}`, 'utf8',function(err, description){
          fs.readdir('./data', function(error, filelist){

            var list = template.list(title, filelist);
            var html = template.html(title, list,
              `<h2>${title}</h2>${description}`,
              `<a href="/create">create</a> <a href="/update?id=${title}">update</a>
              <form action="/delete_process" method="post" style="display:inline">
                <input type="hidden" name="id" value="${title}">
                <input type="submit" value="delete">
              </form>`);
            response.writeHead(200);
            response.end(html);

          });
        });
      }
    }
    else if(pathname === '/create'){//create
      fs.readdir('./data', function(error, filelist){

        var title = 'New File Create';
        var list = template.list(title, filelist);
        var html = template.html(title, list, `
          <form action = "/create_process" method = "post">
            <p><input type ="text" name = "title" placeholder = "title"></p>
            <p>
              <textarea name = "description" placeholder="description"></textarea>
            </p>
            <p>
              <input type="submit">
            </p>
          </form>
          `,'');
        response.writeHead(200);
        response.end(html);
      });

    }
    else if(pathname === '/create_process'){//create된 문서 처리
      var body='';
      request.on('data', function(data){
        body += data;
      });
      request.on('end', function(){
        var post = qs.parse(body);
        var title = post.title;
        var description = post.description;
        //redirection
        fs.writeFile(`data/${title}`, description, 'utf8', function(err){
          response.writeHead(302, {Location: `/?id=${title}`});
          response.end();
        });
      });

    }
    else if(pathname === '/update'){//update
      fs.readFile(`data/${title}`, 'utf8',function(err, description){
        fs.readdir('./data', function(error, filelist){

          var list = template.list(title, filelist);
          var html = template.html(title, list,
            `
            <form action = "/update_process" method = "post">
              <input type="hidden" name= "id" value="${title}">
              <p><input type ="text" name = "title" placeholder = "title" value="${title}"></p>
              <p>
                <textarea name = "description" placeholder="description">${description}</textarea>
              </p>
              <p>
                <input type="submit">
              </p>
            </form>
            `,
            `<a href="/create">create</a> <a href="/update?id=${title}">update</a>`);
          response.writeHead(200);
          response.end(html);

        });
      });
    }
    else if(pathname === '/update_process'){//update 문서 처리
      var body='';
      request.on('data', function(data){
        body += data;
      });
      console.log(body);
      request.on('end', function(){
        var post = qs.parse(body);
        var id = post.id;
        var title = post.title;
        var description = post.description;
        //rename and redirection
        fs.rename(`data/${id}`,`data/${title}`,function(error){
          fs.writeFile(`data/${title}`, description, 'utf8', function(err){
            response.writeHead(302, {Location: `/?id=${title}`});
            response.end();
          })
        });
      });
    }
    else if(pathname === '/delete_process'){//delete_process

      var body='';
      request.on('data', function(data){
        body += data;
      });
      request.on('end', function(){
        var post = qs.parse(body);
        var id = post.id;
        fs.unlink(`data/${id}`, function(err){
          response.writeHead(302, {Location: `/`});
          response.end();
        });

      });
    }
    else{//오류
      response.writeHead(404);//200이라는 숫자를 서버가 브라우저에 주면 성공적, 404면 파일을 찾을 수 없음
      response.end('Not Found');
    }

});
//포트 연결
app.listen(3000);
