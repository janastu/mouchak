var template = _.template($('#image-template').html());
$("#select").on('change',onSelectChange);
M = {};
$.getJSON("http://localhost:60/js/maraa.json",function(data){
		M = data;
		_.each(data.image_list, function(item) {
        if(item.tag == "CR")
						x = $('#imgs').append(template({
								img: item.image
						}))});
});
function onSelectChange(e){
		$("#imgs").html('');
		_.each(M.image_list,  function(item) {
        if(item.tag == e.currentTarget.value)
						x = $('#imgs').append(template({
								img: item.image
						}));});
}
