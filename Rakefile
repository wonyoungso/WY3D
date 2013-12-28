
task :default => [:uglify]

task :uglify do
  # 디렉토리 다 긁어서 uglify하도록 고칠것
  
  directories = [
    './src/*.js',
    './src/math/*.js'
  ]

  `uglifyjs #{directories.join(' ')} > ./build/WY3D.js`
  p "Uglification Completed!"
end