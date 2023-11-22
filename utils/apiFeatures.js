//in this file we have created class APIFeatures in which we have included methods filter(), sort(), limitFields() //and paginate(). APIFeatures class is being exported to tourController.js file and used in getAllTours() function



class APIFeatures{
    constructor(query, queryString) {
        this.query = query;
        this.queryString = queryString;
    }

    filter(){
        /**  1A - FILTERING  */
        //using destructuring to make hardcopy of requesting object 
        const queryObj = { ...this.queryString };
        const excludedFields = ['page', 'sort', 'limit', 'fields'];
        //words in excludeFields array ll be excluded from requesting object 
        excludedFields.forEach(el => delete queryObj[el]);

        /* 1B - ADVANCE FILTERING */ 
        let queryStr = JSON.stringify(queryObj);
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
        //it is getting the query strings coming from adress bar 
        this.query = this.query.find(JSON.parse(queryStr));

        return this;
    }

    sort() {
        /** 2. SORTING **/
        if(this.queryString.sort){
            const sortBy = this.queryString.sort.split(',').join(' ');
            this.query = this.query.sort(sortBy);
        }else {
            this.query = this.query.sort('-createdAt');
        }

        return this;
    }

    limitFields() {
        /* 3. FIELDS LIMITING, limited fields will be shown to clients  */
        if(this.queryString.fields){
            //seprating witth comma ',' & joining with space
            const fields = this.queryString.fields.split(',').join(' '); 
            this.query = this.query.select(fields); //query.select(name duration difficulty price)
        } else {
            //it will remove __v from database which is created by mongoose 
            this.query = this.query.select('-__v');
        }

        return this;
    }

    paginate() {
        /* .4 PAGINATION  */
        //converting into string and setting default value which is 1
        const page = this.queryString.page * 1 || 1;
        const limit = this.queryString.limit * 1 || 100;
        //if page=3, limit=10 thn (3-1) * 10 thn skip = 20  
        const skip = (page - 1) * limit;
        //if skip=20 thn 20 results will be skipped & if limi=10 thn 10 result will on one page
        this.query = this.query.skip(skip).limit(limit);

        //error code is removed from here 

        return this;
    }

}

module.exports = APIFeatures;

