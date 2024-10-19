import app from "./app"
const PORT = process.env.PORT || 8000
app.listen(8080,()=>{
    console.log(`Server running at port ${PORT}`)
})