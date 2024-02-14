
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require('lodash')
const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}))
app.use(express.static("public"));

mongoose.connect("mongodb+srv://Krrish:Todo123@atlascluster.po3atre.mongodb.net/todolistDB")

const itemsSchema = {
    name: String
};
const Item = mongoose.model("Item", itemsSchema)

const item1 = new Item({ name: "Welcome to your todolist!"})
const item2 = new Item({ name: "Hit the + button to add a new item"})
const item3 = new Item({ name: "<--- Hit this button to delete an item"})

const defaultItems = [item1, item2, item3];

app.get('/', async (req, res) => {
    try {
        const foundItems = await Item.find({});
        if(foundItems.length === 0) {
        await Item.insertMany(defaultItems)
        console.log("Items added successfully!");
       return res.redirect('/')
}
        res.render("list", {listTitle: "Today", newListItems: foundItems})
    }
    catch(error){
        console.error("Error encountered:", error);
    }
});

const listSchema = {
    name: String, 
    items: [itemsSchema]
}

const List = mongoose.model("List", listSchema);

app.get('/:customListName', function(req, res) {
    const customListName = _.capitalize(req.params.customListName);
    List.findOne({name: customListName})
    .then((foundList) => { 

    if(!foundList) {

           const list = new List({
            name: customListName, 
            items: defaultItems
        }); 
        list.save(); 
        res.redirect('/' + customListName);
    }
    else {
            res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
        }
    }
   )
    .catch(error => {
        console.log("Error encountered", error);
    })
})

app.post('/', async (req, res) => {
    const itemName = req.body.newItem;
    const listName = req.body.list;
    const item = new Item({
        name: itemName
    });

    try {
        if (listName === 'Today') {
            await item.save();
            res.redirect('/');
        } else {
            const foundList = await List.findOne({ name: listName });
            if (!foundList) {
                console.log(`List '${listName}' not found.`);
                res.redirect('/');
                return;
            }
            foundList.items.push(item);
            await foundList.save();
            res.redirect('/' + listName);
        }
    } catch (error) {
        console.error("Error encountered:", error);
        res.status(500).send("Internal Server Error");
    }
});

app.post("/delete", async function(req, res){
    const checkedItemId = req.body.checkbox; 
    const listName = req.body.listName;
    try {
      if (listName === "Today"){
        await Item.deleteOne({_id: checkedItemId})
        console.log("Successfully deleted checked item from " + listName)
        res.redirect('/'); 
    }
    else {
        const foundList = await List.findOneAndUpdate(
            { name: listName }, 
            { $pull: {items: {_id: checkedItemId}}});
            console.log("Successfully deleted checked item from " + listName)
            res.redirect('/' + listName);      
    }
    }
    catch (error) {
      console.error(error);
    }
  });

app.listen(3000, function(){
    console.log("server running at port 3000");
})
