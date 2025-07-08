PLAN_FILE=actions-gallery.plan

LOG_LEVEL='' # DEBUG
TF=terraform

main: plan

plan:
	@TF_LOG=$(LOG_LEVEL) $(TF) plan -out $(PLAN_FILE)

apply:
	@$(TF) apply -auto-approve $(PLAN_FILE)

show:
	$(TF) show

refresh:
	$(TF) refresh

validate:
	$(TF) validate

clean:
	rm $(PLAN_FILE)

lint:
	tflint

graph:
	$(TF) graph > graph.dot
	dot -Tsvg graph.dot -o graph.svg

log:
	wrangler tail custom-domain-worker


.PHONY: clean plan
