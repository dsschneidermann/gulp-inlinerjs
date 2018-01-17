# gulp-inlinerjs
Gulp wrapper for **inline-js**: https://github.com/eight04/inline-js#readme

Load with gulp-load-plugins, usage:

```
gulp.src("index.html")
    .pipe(plugins.inlinerjs())
```

You can pass additional resources, transforms, shortcuts and a custom logger function.

*Note:* gulp-inline-js name was taken on npm, so this plugin is named gulp-*inlinerjs*
