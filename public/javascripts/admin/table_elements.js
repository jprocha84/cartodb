

  $(document).ready(function(){

    //SUBHEADER EVENTS AND FLOATING WINDOWS

    //Save operation loader
    $('section.subheader').append(
    '<div class="performing_op">' +
      '<p class="loading">Loading...</p>'+
    '</div>');



    //Change title name window
    $('div.inner_subheader div.left').append(
      '<span class="title_window">'+
        '<p>Pick a name for this table</p>'+
        '<form id="change_name" method="get" action="#"><input type="text" name="title"/>'+
        '<input type="submit" value="Save" name="submit"/></form>'+
      '</span>');
    //Bind events
    // -Open window
    $('section.subheader h2 a').livequery('click',function(ev){
      ev.stopPropagation();
      ev.preventDefault();
      if ($('span.title_window').is(':visible')) {
        $('span.title_window').hide();
      } else {
        closeAllWindows();
        bindESC();
        var position = ($(this).parent().width()/2) - 118;
        if ($('section.subheader h2 a').text()=='Untitle table') {
          $('span.title_window input[type="text"]').attr('value','');
        } else {
          $('span.title_window input[type="text"]').attr('value',$('section.subheader h2 a').text());
        }
        $('span.title_window').css('left',position+'px').show();
        $('span.title_window input[type="text"]').focus();
      }
    });
    // -Save table name
    $('#change_name').livequery('submit',function(ev){
      ev.preventDefault();
      ev.stopPropagation();
      var new_value = $('span.title_window input[type="text"]').attr('value');
      var old_value = $('section.subheader h2 a').text();
      if (new_value==old_value) {
        $('span.title_window').hide();
      } else if (new_value=='') {
        $('span.title_window input').css('border-color','#D05153');
        setTimeout(function(){$('span.title_window input').css('border-color','#999999')},1000);
      } else {
        $('section.subheader h2 a').text(new_value);
        $('span.title_window').hide();
        changesRequest('/update','name',new_value,old_value);
      }
    });


    // Change table status
    $('div.inner_subheader div.left').append(
      '<span class="privacy_window">'+
        '<ul>'+
          '<li class="public '+((status=="public")?'selected':'')+'"><a href="#"><strong>Public</strong> (visible to others)</a></li>'+
          '<li class="private '+((status=="private")?'selected':'')+'"><a href="#"><strong>Private</strong> (visible to you)</a></li>'+
        '</ul>'+
      '</span>');
  
    $('span.privacy_window ul li a').livequery('click',function(ev){
      ev.stopPropagation();
      ev.preventDefault();
      var parent_li = $(this).parent();
      if (parent_li.hasClass('selected')) {
        $('span.privacy_window').hide();
      } else {
        var old_value = $('span.privacy_window ul li.selected a strong').text().toLowerCase();
        $('span.privacy_window ul li').removeClass('selected');
        parent_li.addClass('selected');
        var new_value = $('span.privacy_window ul li.selected a strong').text().toLowerCase();
        $('span.privacy_window').hide();
        $('p.status a').removeClass('public private').addClass(new_value).text(new_value);
        changesRequest('/toggle_privacy','privacy',new_value.toUpperCase(),old_value);
      }
    });

    $('p.status a').livequery('click',function(ev){
      ev.stopPropagation();
      ev.preventDefault();
      var privacy_window = $(this).parent().parent().children('span.privacy_window');
      if (privacy_window.is(':visible')) {
        privacy_window.hide();
      } else {
        closeAllWindows();
        bindESC();
        var status_position = $('p.status a').position();
        privacy_window.css('left',status_position.left-72+'px').show();
      }
    });
    // End table status binding


    
    
    //Change tags
    $('div.inner_subheader div.left').append(
      '<span class="tags_window">'+
        '<ul id="tags_list"></ul>'+
        '<a href="#save_tags">Save</a>'+
      '</span>');
      
    $('span.tags a.add').click(function(ev){
      ev.stopPropagation();
      ev.preventDefault();
      var values = [];
      $('span.tags p').each(function(index,element){
        values.push($(element).text());
      });
      $("#tags_list").tagit(
        //{availableTags: ["c++", "java", "php", "coldfusion", "javascript", "asp", "ruby", "python", "c", "scala", "groovy", "haskell", "perl"]}
        {values: values}
      );
      $('span.tags_window').show();
    });
    
    $('span.tags_window a').click(function(ev){
      ev.stopPropagation();
      ev.preventDefault();
      var old_values = [];
      $("span.tags p").each(function(index,element){
        old_values.push($(element).text());
      });
      var new_values = '';
      $("span.tags p").remove();  
      $("li.tagit-choice").each(function(index,element){
        var value = (($.trim($(element).text())).slice(0, -2));
        $('<p>'+value+'</p>').insertBefore('a.add');
        new_values+=value+',';
      });

      $('span.tags_window').hide();
      changesRequest('/update','tags',new_values,old_values);
    });
    



    //Advanced options
    $('div.inner_subheader div.right').append(
      '<span class="advanced_options">'+
        '<a href="#close_advanced_options" class="advanced">advanced<span></span></a>'+
        '<ul>'+
          '<li><a href="#export_data">Export data...</a></li>'+
          '<li><a href="#save_table">Save table as...</a></li>'+
        '</ul>'+
      '</span>');

    $('p.settings a.settings, span.advanced_options a.advanced').livequery('click',function(ev){
      ev.stopPropagation();
      ev.preventDefault();
      if (!$('span.advanced_options').is(':visible')) {
        closeAllWindows();
        bindESC();
        $(this).parent().parent().children('span.advanced_options').show();
        $('body').click(function(event) {
          if (!$(event.target).closest('span.advanced_options').length) {
            $('span.advanced_options').hide();
            $('body').unbind('click');
          };
        });
      } else {
        $(this).parent().hide();
        $('body').unbind('click');
      }
    });
    //End advanced options
    
  });



  function changesRequest(url_change,param,value,old_value) {
    //show loader
    $('div.performing_op').show();

    var params = {};
    params[param] = value;
    $.ajax({
      dataType: 'json',
      type: "PUT",
      url: '/api/json/tables/'+table_id+url_change,
      data: params,
      success: function(data) {
        successActionPerform(param);
      },
      error: function(e) {
        errorActionPerforming(param,old_value);
      }
    });
  }



  function successActionPerform(param) {
    switch (param) {
      case 'privacy': $('div.performing_op p').removeClass('loading').addClass('success').text('The status has been changed');
                      var width_text = $('div.performing_op p').width();
                      $('div.performing_op').css('margin-left','-'+(width_text/2)+'px');
                      break;
      ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
      case 'name':    $('div.performing_op p').removeClass('loading').addClass('success').text('The table name has been changed');
                      var width_text = $('div.performing_op p').width();
                      $('div.performing_op').css('margin-left','-'+(width_text/2)+'px');
                      break;
      ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
      case 'tags':    $('div.performing_op p').removeClass('loading').addClass('success').text('Tags changed');
                      var width_text = $('div.performing_op p').width();
                      $('div.performing_op').css('margin-left','-'+(width_text/2)+'px');
                      break;
      ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
      default:
    }
    $('div.performing_op').delay(2000).fadeOut(function(){resetLoader()});
  }
  
  



  function errorActionPerforming(param, old_value) {
    switch (param) {
      case 'privacy': $('div.performing_op p').removeClass('loading').addClass('error').text('The status has not been changed. Try again later.');
                      var width_text = $('div.performing_op p').width();
                      $('div.performing_op').css('margin-left','-'+(width_text/2)+'px');
                      $('span.privacy_window ul li').removeClass('selected');
                      $('span.privacy_window ul li.'+old_value).addClass('selected');
                      $('p.status a').removeClass('public private').addClass(old_value).text(old_value);
                      break;
      ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
      case 'name':    $('div.performing_op p').removeClass('loading').addClass('error').text('The table name has not been changed. Try again later.');
                      var width_text = $('div.performing_op p').width();
                      $('div.performing_op').css('margin-left','-'+(width_text/2)+'px');
                      $('section.subheader h2 a').text(old_value);
                      break;
      ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
      case 'tags':    $('div.performing_op p').removeClass('loading').addClass('error').text('Impossible to change the tags. Try again later.');
                      var width_text = $('div.performing_op p').width();
                      $('div.performing_op').css('margin-left','-'+(width_text/2)+'px');
                      $("span.tags p").remove();
                      $.each(old_value,function(index,element){
                        $('<p>'+element+'</p>').insertBefore('a.add');
                      });
                      break;
      ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
      default:
    }
    $('div.performing_op').delay(2000).fadeOut(function(){resetLoader()});
  }




  function resetLoader() {
    $('div.performing_op p').removeClass('success').addClass('loading').text('Loading...');
    var width_text = $('div.performing_op p').width();
    $('div.performing_op').css('margin-left','-'+(width_text/2)+'px');
  }
  
  
  function bindESC() {
    $(document).keydown(function(){
      if (event.which == '27') {
        closeAllWindows();
      }
    });
  }
  
  function unbindESC() {
    $(document).unbind('keydown');
  }  
  
  
  
  function closeAllWindows() {
    $('span.privacy_window').hide();
    $('span.title_window').hide();
    $('span.advanced_options').hide();
    $(document).unbind('keydown');
  }
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  





